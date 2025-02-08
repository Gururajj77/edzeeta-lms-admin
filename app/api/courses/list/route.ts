import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/app/firebase/firebase-admin-config";

const db = getFirestore(app);

export async function GET() {
  try {
    const coursesSnapshot = await db
      .collection("courses")
      .select("mainTitle")
      .get();

    const courses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      mainTitle: doc.data().mainTitle,
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
