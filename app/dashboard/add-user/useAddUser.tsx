"use client";

import { useState, useEffect } from "react";

interface CourseOption {
  id: string;
  mainTitle: string;
}

interface NewUser {
  email: string;
  password: string;
  courseIds: string[];
}

export function useAddUser() {
  const [formData, setFormData] = useState<NewUser>({
    email: "",
    password: "",
    courseIds: [],
  });

  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses/list");
      const data = await response.json();
      setAvailableCourses(data.courses);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to fetch courses");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseSelect = (courseId: string) => {
    setFormData((prev) => {
      if (prev.courseIds.includes(courseId)) {
        return {
          ...prev,
          courseIds: prev.courseIds.filter((id) => id !== courseId),
        };
      } else {
        return {
          ...prev,
          courseIds: [...prev.courseIds, courseId],
        };
      }
    });
  };

  const clearAllFields = () => {
    setFormData({
      email: "",
      password: "",
      courseIds: [],
    });
    setGeneratedPassword(""); // Clear the generated password as well
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        courseIds: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setGeneratedPassword(password);
  };

  const useGeneratedPassword = () => {
    setFormData((prev) => ({
      ...prev,
      password: generatedPassword,
    }));
  };

  return {
    formData,
    availableCourses,
    loading,
    error,
    success,
    generatedPassword,
    handleInputChange,
    handleCourseSelect,
    clearAllFields,
    handleSubmit,
    generatePassword,
    useGeneratedPassword,
  };
}
