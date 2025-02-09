// types/admin/add-user.ts
export interface NewUser {
  email: string;
  password: string;
  courseIds: string[];
}

export interface CourseOption {
  id: string;
  mainTitle: string;
}
