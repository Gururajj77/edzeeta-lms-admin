import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";

const db = getFirestore(app);

export async function POST(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { courseIds } = await request.json();
    const userId = context.params.userId;

    if (!courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: "Valid course IDs array is required" },
        { status: 400 }
      );
    }

    // Verify that the user exists
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's courses
    await db.collection("users").doc(userId).update({
      courseIds,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "User courses updated successfully",
    });
  } catch (error) {
    console.error("Error updating user courses:", error);
    return NextResponse.json(
      { error: "Failed to update user courses" },
      { status: 500 }
    );
  }
}
