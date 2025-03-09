"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  mainTitle: string;
}

export interface User {
  id: string;
  email: string;
  courseIds: string[];
  createdAt: string;
}

export function useUserDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch courses");
      }

      setCourses(data.courses);
    } catch (err) {
      // We already show error for users, so we'll silently log this one
      console.error("Failed to fetch courses:", err);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setSelectedUser(null);
  };

  const sendPasswordResetEmail = async (userId: string, email: string) => {
    try {
      setProcessingAction(true);
      console.log(`Sending reset email to ${email} for user ${userId}`);

      // Make sure userId is a string and properly formatted
      if (!userId || typeof userId !== "string") {
        throw new Error("Invalid user ID");
      }

      // Construct the URL carefully
      const url = `/api/users/${encodeURIComponent(userId)}/send-reset-email`;
      console.log(`Making request to: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log(`Response status: ${response.status}`);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to send password reset email");
      }

      setSuccessMessage("Password reset email sent successfully");
      closeResetPasswordModal();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error in sendPasswordResetEmail:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send password reset email"
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const updateUserCourses = async (courseIds: string[]) => {
    if (!selectedUser) return;

    try {
      setProcessingAction(true);
      const response = await fetch(
        `/api/users/${selectedUser.id}/update-courses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseIds }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update courses");
      }

      // Update local state to reflect changes
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, courseIds } : user
        )
      );

      setSuccessMessage("User courses updated successfully");
      closeEditModal();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update courses");
    } finally {
      setProcessingAction(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    users,
    courses,
    loading,
    error,
    selectedUser,
    isEditModalOpen,
    isResetPasswordModalOpen,
    processingAction,
    successMessage,
    fetchUsers,
    openEditModal,
    closeEditModal,
    openResetPasswordModal,
    closeResetPasswordModal,
    sendPasswordResetEmail,
    updateUserCourses,
    clearError,
  };
}
