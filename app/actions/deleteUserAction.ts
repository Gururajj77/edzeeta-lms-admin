"use server";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { revalidatePath } from "next/cache";

const auth = getAuth(app);
const db = getFirestore(app);

type DeleteUserResult = {
  success: boolean;
  message: string;
};

export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    // Step 1: Check if the user exists in Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return {
        success: false,
        message: "User not found in database",
      };
    }

    // Save user data before deletion for potential restoration
    const userData = userDoc.data();

    // Step 2: Delete the user document from Firestore
    await db.collection("users").doc(userId).delete();

    // Step 3: Delete the user from Firebase Authentication
    try {
      await auth.deleteUser(userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (authError: any) {
      // If auth deletion fails, try to restore the Firestore document
      if (userData) {
        // Add this check to ensure userData is defined
        await db.collection("users").doc(userId).set(userData);
      }

      if (authError.code === "auth/user-not-found") {
        // If the user doesn't exist in Auth but exists in Firestore,
        // we've at least deleted the Firestore record so return partial success
        return {
          success: true,
          message:
            "User deleted from database only (not found in authentication system)",
        };
      }

      throw authError; // Re-throw for the outer catch
    }

    // Revalidate relevant paths to refresh data
    revalidatePath("/dashboard");
    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error deleting user:", error);

    // Provide more specific error messages based on the error
    if (error.code === "auth/user-not-found") {
      return {
        success: false,
        message: "User not found in authentication system",
      };
    }

    return {
      success: false,
      message: error.message || "Failed to delete user",
    };
  }
}
