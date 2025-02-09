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

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Get course details for email
    const coursesSnapshot = await db
      .collection("courses")
      .where("__name__", "in", courseIds)
      .get();

    const courses = coursesSnapshot.docs.map((doc) => ({
      mainTitle: doc.data().mainTitle,
    }));

    // Create Firestore user document
    await db.collection("users").doc(userRecord.uid).set({
      email,
      courseIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send welcome email
    await sendWelcomeEmail(email, password, courses);

    return NextResponse.json({
      message: "User created successfully",
      userId: userRecord.uid,
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    let errorMessage = "Failed to create user";
    const errorCode = (error as { code: string }).code;
    switch (errorCode) {
      case "auth/email-already-exists":
        errorMessage = "Email is already in use";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address";
        break;
      case "auth/invalid-password":
        errorMessage = "Password must be at least 6 characters";
        break;
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// const errorCode = (error as { code: string }).code;
