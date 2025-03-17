"use server";

import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { Course } from "@/app/types/admin/course-creation";
import { revalidatePath } from "next/cache";

const db = getFirestore(app);

type UpdateCourseResult = {
  success: boolean;
  message: string;
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

    // Update course basic info
    await db
      .collection("courses")
      .doc(courseId)
      .update({
        mainTitle: courseData.mainTitle,
        description: courseData.description,
        status: courseData.status || "draft",
        updatedAt: new Date().toISOString(),
      });

    // Fetch all existing modules first for tracking
    const existingModulesSnapshot = await db
      .collection("courses")
      .doc(courseId)
      .collection("modules")
      .get();

    // Create a map of existing module IDs to track which ones to keep
    const moduleIdsToKeep = new Set<string>();

    // Update modules and their sections
    // eslint-disable-next-line @next/next/no-assign-module-variable
    for (const module of courseData.modules) {
      // Check if this is a new module (with a temporary ID)
      const isNewModule = module.id.startsWith("module-");
      const moduleRef = isNewModule
        ? db.collection("courses").doc(courseId).collection("modules").doc() // Generate a new Firestore ID
        : db
            .collection("courses")
            .doc(courseId)
            .collection("modules")
            .doc(module.id);

      // If updating an existing module, add it to the set of IDs to keep
      if (!isNewModule) {
        moduleIdsToKeep.add(module.id);
      }

      // Create or update module
      if (isNewModule) {
        // Create new module
        await moduleRef.set({
          id: moduleRef.id,
          moduleName: module.moduleName,
          description: module.description,
          order: module.order,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Update existing module
        await moduleRef.update({
          moduleName: module.moduleName,
          description: module.description,
          order: module.order,
          updatedAt: new Date().toISOString(),
        });
      }

      // Fetch existing sections for this module for tracking
      const existingSectionsSnapshot = await moduleRef
        .collection("sections")
        .get();
      const sectionIdsToKeep = new Set<string>();

      // Process all sections for this module
      for (const section of module.sections) {
        // Check if this is a new section (with a temporary ID)
        const isNewSection = section.id.startsWith("section-");
        const sectionRef = isNewSection
          ? moduleRef.collection("sections").doc() // Generate a new Firestore ID
          : moduleRef.collection("sections").doc(section.id);

        // If updating an existing section, add it to the set of IDs to keep
        if (!isNewSection) {
          sectionIdsToKeep.add(section.id);
        }

        // Create or update section
        if (isNewSection) {
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
        } else {
          // Update existing section
          await sectionRef.update({
            title: section.title,
            description: section.description,
            order: section.order,
            videos: section.videos,
            videoId: section.videoId || null,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Delete sections that are no longer in the updated data
      existingSectionsSnapshot.docs.forEach(async (doc) => {
        if (!sectionIdsToKeep.has(doc.id)) {
          await doc.ref.delete();
        }
      });
    }

    // Delete modules that are no longer in the updated data
    existingModulesSnapshot.docs.forEach(async (doc) => {
      if (!moduleIdsToKeep.has(doc.id)) {
        await doc.ref.delete();
      }
    });

    // Revalidate the dashboard page to reflect changes
    revalidatePath("/dashboard/update-course");

    return { success: true, message: "Course updated successfully" };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, message: "Failed to update course" };
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
