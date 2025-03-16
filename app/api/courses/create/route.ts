import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  NewCourse,
  CourseModule,
  VideoSection,
  Video,
} from "../../../types/admin/course-creation";

// Initialize Firebase Admin
const apps = getApps();
const app =
  apps.length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      })
    : apps[0];

const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const courseData: NewCourse = await request.json();

    // Add timestamps and other metadata
    const courseWithMetadata = {
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      enrollmentCount: 0,
    };

    // Create a new course document
    const courseRef = db.collection("courses").doc();
    const courseId = courseRef.id;

    // Prepare modules subcollection data
    const modulesPromises = courseData.modules.map(
      async (module: CourseModule, moduleIndex: number) => {
        const moduleRef = courseRef.collection("modules").doc();
        const moduleId = moduleRef.id;

        // Prepare sections subcollection data
        const sectionsPromises = module.sections.map(
          async (section: VideoSection, sectionIndex: number) => {
            const sectionRef = moduleRef.collection("sections").doc();

            // Process videos data - Handle both new videos array and legacy videoId
            let videos: Video[] = [];

            // If section has a videos array, use it
            if (section.videos && section.videos.length > 0) {
              videos = section.videos.map((video) => ({
                id: video.id,
                name: video.name || "", // Include the name property
                duration: video.duration || 0,
              }));
            }
            // If no videos array but has videoId, create a single video entry
            else if (section.videoId) {
              videos = [
                {
                  id: section.videoId,
                  name: "", // Add an empty name as default
                  duration: section.duration || 0,
                },
              ];
            }

            // Set total duration based on all videos
            const totalDuration = videos.reduce(
              (total, video) => total + (video.duration || 0),
              0
            );

            return sectionRef.set({
              id: sectionRef.id,
              title: section.title,
              videoId:
                section.videoId || (videos.length > 0 ? videos[0].id : ""), // Keep for backward compatibility
              videos: videos,
              duration: totalDuration > 0 ? totalDuration : null, // Total duration of all videos
              description: section.description || "",
              order: section.order || sectionIndex,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        );

        // Set module document and its sections
        await moduleRef.set({
          id: moduleId,
          moduleName: module.moduleName,
          description: module.description || "",
          order: module.order || moduleIndex,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await Promise.all(sectionsPromises);
      }
    );

    // Create the course document and wait for all modules and sections to be created
    await courseRef.set({
      id: courseId,
      mainTitle: courseWithMetadata.mainTitle,
      description: courseWithMetadata.description || "",
      createdAt: courseWithMetadata.createdAt,
      updatedAt: courseWithMetadata.updatedAt,
      status: courseWithMetadata.status,
      enrollmentCount: courseWithMetadata.enrollmentCount,
      moduleCount: courseData.modules.length,
      totalSections: courseData.modules.reduce(
        (acc: number, module: CourseModule) => acc + module.sections.length,
        0
      ),
    });

    await Promise.all(modulesPromises);

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      courseId,
    });
  } catch (error: unknown) {
    console.error("Error creating course:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create course",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
