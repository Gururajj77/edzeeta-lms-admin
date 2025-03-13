// app/dashboard/update-course/page.tsx
"use client";
import React from "react";
import CoursesList from "@/app/comps/update-courses/CoursesList";

export default function UpdateCoursePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Course Management</h1>
      <CoursesList />
    </div>
  );
}
