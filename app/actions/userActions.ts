"use server";

import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { revalidatePath } from "next/cache";

const db = getFirestore(app);

type UpdateCoursesResult = {
  success: boolean;
  message: string;
};

export async function updateUserCourses(
  userId: string,
  courseIds: string[]
): Promise<UpdateCoursesResult> {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    if (!courseIds || !Array.isArray(courseIds)) {
      return {
        success: false,
        message: "Valid course IDs array is required",
      };
    }

    // Verify that the user exists
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Update the user's courses
    await db.collection("users").doc(userId).update({
      courseIds,
      updatedAt: new Date().toISOString(),
    });

    // Optionally revalidate related paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User courses updated successfully",
    };
  } catch (error) {
    console.error("Error updating user courses:", error);
    return {
      success: false,
      message: "Failed to update user courses",
    };
  }
}
