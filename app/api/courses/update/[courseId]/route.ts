/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/courses/[courseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { Course } from "@/app/types/admin/course-creation";
import { revalidatePath } from "next/cache";

const db = getFirestore(app);

type ApiResponse = {
  success: boolean;
  message: string;
  data?: any; // To return updated IDs if needed
};

// Handle PUT request for updating a course
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
): Promise<NextResponse> {
  try {
    const courseId = params.courseId;

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID" },
        { status: 400 }
      );
    }

    const courseData: Course = await request.json();
    const result = await updateCourse(courseId, courseData);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle DELETE request for deleting a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
): Promise<NextResponse> {
  try {
    const courseId = params.courseId;

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID" },
        { status: 400 }
      );
    }

    const result = await deleteCourse(courseId);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateCourse(
  courseId: string,
  courseData: Course
): Promise<ApiResponse> {
  try {
    // Start a Firestore transaction for atomic updates
    return await db.runTransaction(async (transaction) => {
      // Verify that the course exists
      const courseDocRef = db.collection("courses").doc(courseId);
      const courseDoc = await transaction.get(courseDocRef);

      if (!courseDoc.exists) {
        return { success: false, message: "Course not found" };
      }

      // Update course basic info
      transaction.update(courseDocRef, {
        mainTitle: courseData.mainTitle,
        description: courseData.description,
        status: courseData.status || "draft",
        updatedAt: new Date().toISOString(),
      });

      // Fetch all existing modules first
      const existingModulesSnapshot = await db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .get();

      // Create a map of all existing modules by ID and by name
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

      // Create a set to track which module IDs to keep
      const moduleIdsToKeep = new Set<string>();

      // Process each module in the course data
      const moduleProcessingPromises = courseData.modules.map(
        async (module) => {
          let moduleRef;
          let moduleId = module.id;
          const isNewModule = module.id.startsWith("module-");

          // Handle new module creation or find existing module with same name
          if (isNewModule) {
            // Check if a module with this name already exists
            const existingModule = existingModulesByName.get(module.moduleName);

            if (existingModule) {
              // Use the existing module instead of creating a new one
              moduleRef = db
                .collection("courses")
                .doc(courseId)
                .collection("modules")
                .doc(existingModule.id);
              moduleId = existingModule.id;

              // Update the existing module
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

            // Check if this module actually exists
            const moduleDoc = await moduleRef.get();
            if (!moduleDoc.exists) {
              console.error(
                `Module with ID ${module.id} does not exist, skipping update`
              );
              return; // Skip this module
            }

            await moduleRef.update({
              moduleName: module.moduleName,
              description: module.description,
              order: module.order,
              updatedAt: new Date().toISOString(),
            });
          }

          // Add this module ID to the set of IDs to keep
          moduleIdsToKeep.add(moduleId);

          // Get existing sections for this module
          const existingSectionsSnapshot = await moduleRef
            .collection("sections")
            .get();
          const sectionIdsToKeep = new Set<string>();

          // Process sections for this module
          const sectionProcessingPromises = module.sections.map(
            async (section) => {
              const isNewSection = section.id.startsWith("section-");
              const sectionRef = isNewSection
                ? moduleRef.collection("sections").doc()
                : moduleRef.collection("sections").doc(section.id);

              if (!isNewSection) {
                sectionIdsToKeep.add(section.id);
              }

              if (isNewSection) {
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
                // Check if this section actually exists
                const sectionDoc = await sectionRef.get();
                if (!sectionDoc.exists) {
                  console.error(
                    `Section with ID ${section.id} does not exist, skipping update`
                  );
                  return; // Skip this section
                }

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
          );

          // Wait for all section operations to complete
          await Promise.all(sectionProcessingPromises);

          // Delete sections that are no longer in the updated data
          const deleteSectionPromises = existingSectionsSnapshot.docs.map(
            async (doc) => {
              if (!sectionIdsToKeep.has(doc.id)) {
                await doc.ref.delete();
              }
            }
          );

          await Promise.all(deleteSectionPromises);
        }
      );

      // Wait for all module operations to complete
      await Promise.all(moduleProcessingPromises);

      // Delete modules that are no longer in the updated data
      const deleteModulePromises = existingModulesSnapshot.docs.map(
        async (doc) => {
          if (!moduleIdsToKeep.has(doc.id)) {
            // First delete all sections in this module
            const sectionsSnapshot = await doc.ref.collection("sections").get();
            const deleteSectionPromises = sectionsSnapshot.docs.map(
              (sectionDoc) => sectionDoc.ref.delete()
            );
            await Promise.all(deleteSectionPromises);

            // Then delete the module itself
            await doc.ref.delete();
          }
        }
      );

      await Promise.all(deleteModulePromises);

      // Revalidate the dashboard page to reflect changes
      revalidatePath("/dashboard/update-course");

      return {
        success: true,
        message: "Course updated successfully",
      };
    });
  } catch (error: any) {
    console.error("Error updating course:", error);
    return {
      success: false,
      message: `Failed to update course: ${error.message}`,
    };
  }
}

async function deleteCourse(courseId: string): Promise<ApiResponse> {
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
