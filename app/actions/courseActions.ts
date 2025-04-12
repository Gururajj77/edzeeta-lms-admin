/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { app } from "@/app/firebase/firebase-admin-config";
import {
  Course,
  CourseModule,
  VideoSection,
} from "@/app/types/admin/course-creation";
import { revalidatePath } from "next/cache";

const db = getFirestore(app);
const storage = getStorage(app);

type UpdateCourseResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function updateCourse(
  courseId: string,
  courseData: Course,
  thumbnailFile?: File
): Promise<UpdateCourseResult> {
  try {
    // Verify that the course exists
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      return { success: false, message: "Course not found" };
    }

    // Handle thumbnail upload if provided
    let thumbnailUrl = courseData.thumbnail;

    if (thumbnailFile) {
      const uploadResult = await uploadThumbnail(courseId, thumbnailFile);
      if (!uploadResult.success) {
        return {
          success: false,
          message: `Failed to upload thumbnail: ${uploadResult.message}`,
        };
      }
      thumbnailUrl = uploadResult.url;
    }

    // Update course basic info
    await db
      .collection("courses")
      .doc(courseId)
      .update({
        mainTitle: courseData.mainTitle,
        description: courseData.description,
        status: courseData.status || "draft",
        updatedAt: new Date().toISOString(),
        thumbnail: thumbnailUrl || null,
      });

    // Process modules and their sections
    await processModulesAndSections(courseId, courseData.modules);

    // Revalidate the dashboard page to reflect changes
    revalidatePath("/dashboard/update-course");

    return {
      success: true,
      message: "Course updated successfully",
      data: { thumbnailUrl },
    };
  } catch (error: any) {
    console.error("Error updating course:", error);
    return {
      success: false,
      message: `Failed to update course: ${error.message || "Unknown error"}`,
    };
  }
}

/**
 * Process all modules and their sections for a course
 */
async function processModulesAndSections(
  courseId: string,
  modules: CourseModule[]
): Promise<void> {
  // Fetch all existing modules to track what should be kept
  const existingModulesSnapshot = await db
    .collection("courses")
    .doc(courseId)
    .collection("modules")
    .get();

  // Create maps for easy lookup of existing modules
  const existingModulesById = new Map();
  const existingModulesByName = new Map();

  existingModulesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    existingModulesById.set(doc.id, data);
    existingModulesByName.set(data.moduleName, {
      id: doc.id,
      ...data,
    });
  });

  // Track modules to keep
  const moduleIdsToKeep = new Set<string>();

  // Process all modules in parallel
  await Promise.all(
    modules.map((module) =>
      processModule(
        courseId,
        module,
        existingModulesById,
        existingModulesByName,
        moduleIdsToKeep
      )
    )
  );

  // Delete modules that are no longer in the updated data
  await Promise.all(
    existingModulesSnapshot.docs
      .filter((doc) => !moduleIdsToKeep.has(doc.id))
      .map((doc) => deleteModule(doc.ref))
  );
}

/**
 * Process a single module and its sections
 */
async function processModule(
  courseId: string,
  module: CourseModule,
  existingModulesById: Map<string, any>,
  existingModulesByName: Map<string, any>,
  moduleIdsToKeep: Set<string>
): Promise<void> {
  try {
    let moduleRef;
    let moduleId = module.id;

    // Check if this is a temporary ID (new module from frontend)
    const isNewModule = module.id.startsWith("module-");

    if (isNewModule) {
      // For new modules, check if one with same name exists to prevent duplicates
      const existingModule = existingModulesByName.get(module.moduleName);

      if (existingModule) {
        // Use existing module instead of creating duplicate
        moduleRef = db
          .collection("courses")
          .doc(courseId)
          .collection("modules")
          .doc(existingModule.id);

        moduleId = existingModule.id;
      } else {
        // Create a new module with a generated ID
        moduleRef = db
          .collection("courses")
          .doc(courseId)
          .collection("modules")
          .doc();

        moduleId = moduleRef.id;
      }
    } else {
      // This is an existing module - check if it exists
      const moduleExists = existingModulesById.has(module.id);

      if (!moduleExists) {
        console.error(
          `Module with ID ${module.id} does not exist, creating new`
        );

        // Check if a module with the same name exists to prevent duplicates
        const existingModule = existingModulesByName.get(module.moduleName);

        if (existingModule) {
          moduleRef = db
            .collection("courses")
            .doc(courseId)
            .collection("modules")
            .doc(existingModule.id);

          moduleId = existingModule.id;
        } else {
          // Create module with specified ID
          moduleRef = db
            .collection("courses")
            .doc(courseId)
            .collection("modules")
            .doc(module.id);

          moduleId = module.id;
        }
      } else {
        // Use the existing module
        moduleRef = db
          .collection("courses")
          .doc(courseId)
          .collection("modules")
          .doc(module.id);
      }
    }

    // Add this module's ID to the set of IDs to keep
    moduleIdsToKeep.add(moduleId);

    // Check if document exists before updating
    const moduleDoc = await moduleRef.get();

    if (moduleDoc.exists) {
      // Update existing module
      await moduleRef.update({
        moduleName: module.moduleName,
        description: module.description,
        order: module.order,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new module
      await moduleRef.set({
        id: moduleId,
        moduleName: module.moduleName,
        description: module.description,
        order: module.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Process sections within this module
    await processSections(moduleRef, module.sections);
  } catch (error) {
    console.error(
      `Error processing module ${module.moduleName || module.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Process sections within a module
 */
async function processSections(
  moduleRef: FirebaseFirestore.DocumentReference,
  sections: VideoSection[]
): Promise<void> {
  // Fetch existing sections for tracking
  const existingSectionsSnapshot = await moduleRef.collection("sections").get();

  // Create a map for quick lookup
  const existingSectionsById = new Map();
  existingSectionsSnapshot.docs.forEach((doc) => {
    existingSectionsById.set(doc.id, doc.data());
  });

  const sectionIdsToKeep = new Set<string>();

  // Process all sections in parallel
  await Promise.all(
    sections.map((section) =>
      processSection(moduleRef, section, existingSectionsById, sectionIdsToKeep)
    )
  );

  // Delete sections that are no longer in the updated data
  await Promise.all(
    existingSectionsSnapshot.docs
      .filter((doc) => !sectionIdsToKeep.has(doc.id))
      .map((doc) => doc.ref.delete())
  );
}

/**
 * Process a single section
 */
async function processSection(
  moduleRef: FirebaseFirestore.DocumentReference,
  section: VideoSection,
  existingSectionsById: Map<string, any>,
  sectionIdsToKeep: Set<string>
): Promise<void> {
  try {
    // Check if this is a new section (with a temporary ID)
    const isNewSection = section.id.startsWith("section-");
    let sectionId = section.id;
    let sectionRef;

    if (isNewSection) {
      // This is a new section, create with generated ID
      sectionRef = moduleRef.collection("sections").doc();
      sectionId = sectionRef.id;
    } else {
      // Use the existing section ID
      sectionRef = moduleRef.collection("sections").doc(section.id);
      sectionId = section.id;

      // Check if this section actually exists
      if (!existingSectionsById.has(section.id)) {
        console.log(
          `Section with ID ${section.id} does not exist, will create new`
        );
      }
    }

    // Add this section's ID to the set of IDs to keep
    sectionIdsToKeep.add(sectionId);

    // Check if document exists before updating
    const sectionDoc = await sectionRef.get();

    if (sectionDoc.exists) {
      // Update existing section
      await sectionRef.update({
        title: section.title,
        description: section.description,
        order: section.order,
        videos: section.videos,
        videoId: section.videoId || null,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new section
      await sectionRef.set({
        id: sectionId,
        title: section.title,
        description: section.description,
        order: section.order,
        videos: section.videos,
        videoId: section.videoId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(
      `Error processing section ${section.title || section.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a module and all its sections
 */

// Helper function to delete a module and all its sections
async function deleteModule(
  moduleRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >
) {
  try {
    // Get all sections in this module
    const sectionsSnapshot = await moduleRef.collection("sections").get();

    // Delete all sections first
    const deletePromises = sectionsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    // Then delete the module itself
    await moduleRef.delete();
  } catch (error) {
    console.error(`Error deleting module:`, error);
    throw error; // Propagate the error up
  }
}

export async function deleteCourse(
  courseId: string
): Promise<UpdateCourseResult> {
  try {
    // Verify that the course exists
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      return { success: false, message: "Course not found" };
    }

    // Get all modules to delete their sections
    const modulesSnapshot = await db
      .collection("courses")
      .doc(courseId)
      .collection("modules")
      .get();

    // Delete all sections in each module
    const deleteModulesPromises = modulesSnapshot.docs.map(
      async (moduleDoc) => {
        const sectionsSnapshot = await moduleDoc.ref
          .collection("sections")
          .get();

        // Delete all sections in this module
        const deleteSectionsPromises = sectionsSnapshot.docs.map((sectionDoc) =>
          sectionDoc.ref.delete()
        );

        await Promise.all(deleteSectionsPromises);

        // Delete the module
        return moduleDoc.ref.delete();
      }
    );

    // Wait for all modules and their sections to be deleted
    await Promise.all(deleteModulesPromises);

    // Finally delete the course document
    await db.collection("courses").doc(courseId).delete();

    // Revalidate the dashboard page to reflect changes
    revalidatePath("/dashboard/update-course");

    return { success: true, message: "Course deleted successfully" };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, message: "Failed to delete course" };
  }
}

export async function uploadThumbnail(
  courseId: string,
  file: File
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    if (!file) {
      return { success: false, message: "No file provided" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message:
          "Invalid file type. Please upload a JPEG, PNG, WEBP or GIF image.",
      };
    }

    // Maximum file size (2MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        message: "File is too large. Maximum size is 2MB.",
      };
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `thumbnails/${courseId}/${timestamp}.${fileExtension}`;

    // Get bucket name from environment variable and specify it explicitly
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    // Make sure to remove "gs://" prefix if it exists
    const cleanBucketName = bucketName?.startsWith("gs://")
      ? bucketName.replace("gs://", "")
      : bucketName;

    // Get a reference to the file in Firebase Storage by explicitly specifying the bucket
    const bucket = storage.bucket(cleanBucketName);
    const fileRef = bucket.file(fileName);

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    // Get the public URL
    const url = `https://storage.googleapis.com/${cleanBucketName}/${fileName}`;

    return {
      success: true,
      url: url,
      message: "Thumbnail uploaded successfully",
    };
  } catch (error: any) {
    console.error("Error uploading thumbnail:", error);
    return {
      success: false,
      message: `Failed to upload thumbnail: ${
        error.message || "Unknown error"
      }`,
    };
  }
}
