import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";

const db = getFirestore(app);

export async function GET() {
  try {
    const coursesSnapshot = await db.collection("courses").get();

    const courses = await Promise.all(
      coursesSnapshot.docs.map(async (doc) => {
        const courseData = doc.data();

        // Get all modules for this course
        const modulesSnapshot = await db
          .collection("courses")
          .doc(doc.id)
          .collection("modules")
          .orderBy("order", "asc")
          .get();

        const modules = await Promise.all(
          modulesSnapshot.docs.map(async (moduleDoc) => {
            const moduleData = moduleDoc.data();

            // Get all sections for this module
            const sectionsSnapshot = await db
              .collection("courses")
              .doc(doc.id)
              .collection("modules")
              .doc(moduleDoc.id)
              .collection("sections")
              .orderBy("order", "asc")
              .get();

            const sections = sectionsSnapshot.docs.map((sectionDoc) => {
              const sectionData = sectionDoc.data();

              // Ensure videos array exists
              const videos = sectionData.videos || [];

              // Handle legacy videoId
              if (sectionData.videoId && (!videos || videos.length === 0)) {
                videos.push({
                  id: sectionData.videoId,
                  duration: sectionData.duration || 0,
                });
              }

              return {
                id: sectionDoc.id,
                title: sectionData.title || "",
                description: sectionData.description || "",
                order: sectionData.order || 0,
                videoId: sectionData.videoId,
                videos: videos,
              };
            });

            return {
              id: moduleDoc.id,
              moduleName: moduleData.moduleName || "",
              description: moduleData.description || "",
              order: moduleData.order || 0,
              sections: sections,
            };
          })
        );

        return {
          id: doc.id,
          mainTitle: courseData.mainTitle || "",
          description: courseData.description || "",
          modules: modules,
        };
      })
    );

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
