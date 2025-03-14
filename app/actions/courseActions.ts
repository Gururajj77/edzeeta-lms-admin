// app/actions/courseActions.ts
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

    // Update modules and their sections
    // eslint-disable-next-line @next/next/no-assign-module-variable
    for (const module of courseData.modules) {
      const moduleRef = db
        .collection("courses")
        .doc(courseId)
        .collection("modules")
        .doc(module.id);

      // Update module
      await moduleRef.update({
        moduleName: module.moduleName,
        description: module.description,
        order: module.order,
        updatedAt: new Date().toISOString(),
      });

      // Update sections
      for (const section of module.sections) {
        const sectionRef = moduleRef.collection("sections").doc(section.id);

        // Update section
        await sectionRef.update({
          title: section.title,
          description: section.description,
          order: section.order,
          videos: section.videos,
          videoId: section.videoId,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Revalidate the dashboard page to reflect changes
    revalidatePath("/dashboard/update-course");

    return { success: true, message: "Course updated successfully" };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, message: "Failed to update course" };
  }
}
