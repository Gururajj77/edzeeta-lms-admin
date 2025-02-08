// app/api/users/create/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "../../../firebase/firebase-admin-config";

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

    // Create Firestore user document
    await db.collection("users").doc(userRecord.uid).set({
      email,
      courseIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Optional: Send welcome email
    // You can implement your email sending logic here

    return NextResponse.json({
      message: "User created successfully",
      userId: userRecord.uid,
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    // Handle specific Firebase auth errors
    const errorCode = (error as { code: string }).code;
    let errorMessage = "Failed to create user";

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
      // Add more error cases as needed
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
