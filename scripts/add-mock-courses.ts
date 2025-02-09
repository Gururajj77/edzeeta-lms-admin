// scripts/add-mock-courses.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin directly in the script
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

const courses = [
  {
    mainTitle: "Introduction to Web Development",
    description: "Learn the basics of HTML, CSS, and JavaScript",
    duration: "12 weeks",
    level: "Beginner",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    mainTitle: "Advanced React Development",
    description: "Master React hooks, context, and advanced patterns",
    duration: "8 weeks",
    level: "Advanced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    mainTitle: "UI/UX Design Fundamentals",
    description: "Learn design principles and user experience basics",
    duration: "6 weeks",
    level: "Intermediate",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    mainTitle: "Node.js Backend Development",
    description: "Build scalable backend services with Node.js",
    duration: "10 weeks",
    level: "Intermediate",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    mainTitle: "Mobile App Development with React Native",
    description: "Create cross-platform mobile applications",
    duration: "14 weeks",
    level: "Advanced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function addCourses() {
  try {
    for (const course of courses) {
      const docRef = await db.collection("courses").add(course);
      console.log(`Added course: ${course.mainTitle} with ID: ${docRef.id}`);
    }
    console.log("All courses added successfully!");
  } catch (error) {
    console.error("Error adding courses:", error);
  } finally {
    process.exit();
  }
}

// Run the script
addCourses();
