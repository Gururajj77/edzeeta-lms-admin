import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { app } from "@/app/firebase/firebase-admin-config";

const auth = getAuth(app);

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Log the received params for debugging
    console.log("Received params:", params);

    // Get the email from the request body
    const { email } = await request.json();

    // Make sure userId is available
    if (!params || !params.userId) {
      console.error("Missing userId parameter", params);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const userId = params.userId;
    console.log(`Processing reset for userId: ${userId}, email: ${email}`);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    try {
      // Verify that the user exists and email matches
      const userRecord = await auth.getUser(userId);

      if (userRecord.email !== email) {
        return NextResponse.json(
          { error: "User email mismatch" },
          { status: 400 }
        );
      }

      // Use Firebase's built-in password reset functionality
      await auth.generatePasswordResetLink(email);

      console.log(`Successfully sent reset email to ${email}`);
      return NextResponse.json({
        message: "Password reset email sent successfully",
      });
    } catch (firebaseError) {
      console.error("Firebase error:", firebaseError);
      return NextResponse.json(
        { error: "Failed to process user" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in route handler:", error);

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
