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

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();

      if (!data.courses) {
        throw new Error("Invalid course data received");
      }

      setAvailableCourses(data.courses);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear any previous errors when user is typing
    if (error) setError(null);
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

    // Clear any previous errors when selection changes
    if (error) setError(null);
  };

  const clearAllFields = () => {
    setFormData({
      email: "",
      password: "",
      courseIds: [],
    });
    setGeneratedPassword(""); // Clear the generated password as well
    setError(null);
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    // Validate email
    if (!formData.email) {
      setError("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Validate password
    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    // Validate course selection
    if (formData.courseIds.length === 0) {
      setError("Please select at least one course");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

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
      setGeneratedPassword("");
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_-+=";

    const allChars = lowercase + uppercase + numbers + symbols;

    // Ensure at least one character from each type
    let password =
      lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
      uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
      numbers.charAt(Math.floor(Math.random() * numbers.length)) +
      symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Add remaining random characters
    for (let i = 4; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex];
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setGeneratedPassword(password);
  };

  const useGeneratedPassword = () => {
    setFormData((prev) => ({
      ...prev,
      password: generatedPassword,
    }));

    // Clear any previous errors
    if (error) setError(null);
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
