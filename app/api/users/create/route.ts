// app/api/users/create/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";
import { sendWelcomeEmail } from "@/app/lib/email";

const auth = getAuth(app);
const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const { email, password, courseIds } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!courseIds || courseIds.length === 0) {
      return NextResponse.json(
        { error: "At least one course must be selected" },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Store the userId for potential rollback and email
    const userId = userRecord.uid;

    try {
      // Get course details for email (if courseIds exists and has items)
      let courses: { mainTitle: string }[] = [];

      if (courseIds.length > 0) {
        const coursesSnapshot = await db
          .collection("courses")
          .where("__name__", "in", courseIds)
          .get();

        courses = coursesSnapshot.docs.map((doc) => ({
          mainTitle: doc.data().mainTitle,
        }));
      }

      // Create Firestore user document
      await db.collection("users").doc(userId).set({
        email,
        courseIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send welcome email with userId included
      try {
        await sendWelcomeEmail(userId, email, password, courses);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Continue execution - user creation succeeded but email failed
        // You could add logic here to retry or queue the email
      }

      return NextResponse.json({
        message: "User created successfully",
        userId: userId,
      });
    } catch (firestoreError) {
      // If Firestore operations fail, attempt to delete the Auth user
      console.error("Error in Firestore operations:", firestoreError);
      try {
        await auth.deleteUser(userId);
      } catch (deleteError) {
        console.error("Failed to clean up Auth user after error:", deleteError);
      }
      throw firestoreError; // Re-throw to be caught by outer catch
    }
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    // Extract error code if available
    let errorMessage = "Failed to create user";
    const errorObject = error as { code?: string; message?: string };

    if (errorObject.code) {
      switch (errorObject.code) {
        case "auth/email-already-exists":
          errorMessage = "Email is already in use";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/invalid-password":
          errorMessage = "Password must be at least 6 characters";
          break;
        default:
          errorMessage = errorObject.message || errorMessage;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
