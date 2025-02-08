// types/admin/add-user.ts
export interface NewUser {
  email: string;
  password: string;
  selectedCourses: string[]; // array of course IDs
}

export interface CourseOption {
  id: string;
  mainTitle: string;
}
