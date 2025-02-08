// types/course.ts
interface Section {
  id: string;
  title: string;
  videoId: string; // Store only the video ID/path from Bunny.net
  order: number;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  order: number;
  sections: Section[];
}

export interface Course {
  id: string;
  mainTitle: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  modules: Module[];
  thumbnail?: string;
}

// types/user.ts
export interface CourseProgress {
  courseId: string;
  completedSections: string[]; // Array of section IDs
  lastAccessedModule: string;
  lastAccessedSection: string;
  lastAccessedAt: Date;
}

export interface UserCourse {
  courseId: string;
  assignedAt: Date;
  progress?: CourseProgress;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "student";
  createdAt: Date;
  assignedCourses: UserCourse[];
}

// types/admin.ts
export interface NewCourseInput {
  mainTitle: string;
  description?: string;
  modules: Array<{
    name: string;
    description?: string;
    sections: Array<{
      title: string;
      videoUrl: string;
      duration?: string;
    }>;
  }>;
}

export interface NewUserInput {
  email: string;
  password: string;
  assignedCourses: string[]; // Array of course IDs
}
