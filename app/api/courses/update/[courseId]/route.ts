/* eslint-disable @next/next/no-assign-module-variable */
// app/api/courses/update/[courseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";

const db = getFirestore(app);

// PATCH to update a course
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
): Promise<NextResponse> {
  try {
    const courseId = params.courseId;
    const data = await request.json();

    // Verify that the course exists
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 }
      );
    }

    // Update course basic info
    await db
      .collection("courses")
      .doc(courseId)
      .update({
        mainTitle: data.mainTitle,
        description: data.description,
        status: data.status || "draft", // Add status field
        updatedAt: new Date().toISOString(),
      });

    // Update modules and their sections
    for (const module of data.modules) {
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
          videos: section.videos, // Update the videos array
          videoId: section.videoId, // Keep for backward compatibility
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update course" },
      { status: 500 }
    );
  }
}
