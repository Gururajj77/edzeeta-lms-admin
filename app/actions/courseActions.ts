/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-assign-module-variable */
"use server";

import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { Course } from "@/app/types/admin/course-creation";
import { revalidatePath } from "next/cache";

const db = getFirestore(app);

type UpdateCourseResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function updateCourse(
  courseId: string,
  courseData: Course
): Promise<UpdateCourseResult> {
  try {
    // Verify that the course exists
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      return { success: false, message: "Course not found" };
    }

    // Update course basic info first
    await db
      .collection("courses")
      .doc(courseId)
      .update({
        mainTitle: courseData.mainTitle,
        description: courseData.description,
        status: courseData.status || "draft",
        updatedAt: new Date().toISOString(),
      });

    // Fetch all existing modules for tracking
    const existingModulesSnapshot = await db
      .collection("courses")
      .doc(courseId)
      .collection("modules")
      .get();

    // Create maps for existing modules by ID and by name for quick lookups
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

    // Set to track which module IDs to keep
    const moduleIdsToKeep = new Set<string>();

    // Process all modules with proper Promise handling
    const modulePromises = [];

    for (const module of courseData.modules) {
      // Add the processing of this module to our promises array
      modulePromises.push(
        processModule(courseId, module, existingModulesByName, moduleIdsToKeep)
      );
    }

    // Wait for all module processing to complete
    await Promise.all(modulePromises);

    // Delete modules that are no longer in the updated data - with proper Promise handling
    const deletePromises: any = [];

    existingModulesSnapshot.docs.forEach((doc) => {
      if (!moduleIdsToKeep.has(doc.id)) {
        deletePromises.push(deleteModule(doc.ref));
      }
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // Revalidate the dashboard page to reflect changes
    revalidatePath("/dashboard/update-course");

    return { success: true, message: "Course updated successfully" };
  } catch (error: any) {
    console.error("Error updating course:", error);
    return {
      success: false,
      message: `Failed to update course: ${error.message || "Unknown error"}`,
    };
  }
}

// Helper function to process a single module
async function processModule(
  courseId: string,
  module: any,
  existingModulesByName: Map<string, any>,
  moduleIdsToKeep: Set<string>
) {
  try {
    // Check if this is a new module (with a temporary ID)
    const isNewModule = module.id.startsWith("module-");
    let moduleRef;
    let moduleId = module.id;

    if (isNewModule) {
      // Check if a module with the same name already exists
      const existingModule = existingModulesByName.get(module.moduleName);

      if (existingModule) {
        // Use existing module instead of creating a new one
        moduleRef = db
          .collection("courses")
          .doc(courseId)
          .collection("modules")
          .doc(existingModule.id);

        moduleId = existingModule.id;

        // Update the existing module with same name
        await moduleRef.update({
          moduleName: module.moduleName,
          description: module.description,
          order: module.order,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create a new module with a generated ID
        moduleRef = db
          .collection("courses")
          .doc(courseId)
          .collection("modules")
          .doc();

        moduleId = moduleRef.id;

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
    } else {
      // This is an existing module - update it
      moduleRef = db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc(module.id);

      // Check if this module actually exists before updating
      const moduleDoc = await moduleRef.get();

      if (!moduleDoc.exists) {
        console.error(
          `Module with ID ${module.id} does not exist, skipping update`
        );
        return; // Skip this module
      }

      // Update the existing module
      await moduleRef.update({
        moduleName: module.moduleName,
        description: module.description,
        order: module.order,
        updatedAt: new Date().toISOString(),
      });
    }

    // Add this module's ID to the set of IDs to keep
    moduleIdsToKeep.add(moduleId);

    // Process sections within this module
    await processSections(moduleRef, module.sections);
  } catch (error) {
    console.error(
      `Error processing module ${module.moduleName || module.id}:`,
      error
    );
    throw error; // Propagate the error up
  }
}

// Helper function to process sections within a module
async function processSections(
  moduleRef: FirebaseFirestore.DocumentReference<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >,
  sections: any
) {
  try {
    // Fetch existing sections for tracking
    const existingSectionsSnapshot = await moduleRef
      .collection("sections")
      .get();
    const sectionIdsToKeep = new Set<string>();

    // Process sections with proper Promise handling
    const sectionPromises = [];

    for (const section of sections) {
      sectionPromises.push(
        processSection(moduleRef, section, sectionIdsToKeep)
      );
    }

    // Wait for all section processing to complete
    await Promise.all(sectionPromises);

    // Delete sections that are no longer in the updated data - with proper Promise handling
    const deletePromises: any = [];

    existingSectionsSnapshot.docs.forEach((doc) => {
      if (!sectionIdsToKeep.has(doc.id)) {
        deletePromises.push(doc.ref.delete());
      }
    });

    // Wait for all section deletions to complete
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error processing sections:", error);
    throw error; // Propagate the error up
  }
}

// Helper function to process a single section
async function processSection(
  moduleRef: any,
  section: any,
  sectionIdsToKeep: Set<string>
) {
  try {
    // Check if this is a new section (with a temporary ID)
    const isNewSection = section.id.startsWith("section-");
    const sectionRef = isNewSection
      ? moduleRef.collection("sections").doc() // Generate a new Firestore ID
      : moduleRef.collection("sections").doc(section.id);

    // If this is an existing section, add its ID to the set of IDs to keep
    if (!isNewSection) {
      sectionIdsToKeep.add(section.id);

      // Verify the section exists before updating
      const sectionDoc = await sectionRef.get();
      if (!sectionDoc.exists) {
        console.error(
          `Section with ID ${section.id} does not exist, skipping update`
        );
        return; // Skip this section
      }

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
        id: sectionRef.id,
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
    throw error; // Propagate the error up
  }
}

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
