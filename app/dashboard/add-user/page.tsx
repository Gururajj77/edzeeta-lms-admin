"use client";

import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseOption {
  id: string;
  mainTitle: string;
}

interface NewUser {
  email: string;
  password: string;
  courseIds: string[];
}

export default function AddUserPage() {
  const [formData, setFormData] = useState<NewUser>({
    email: "",
    password: "",
    courseIds: [],
  });

  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={
                    formData.courseIds[formData.courseIds.length - 1] || ""
                  } // Add this value prop
                  onValueChange={handleCourseSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select courses" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem
                        key={course.id}
                        value={course.id}
                        className={
                          formData.courseIds.includes(course.id)
                            ? "bg-accent"
                            : ""
                        }
                      >
                        {course.mainTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(formData.email ||
                formData.password ||
                formData.courseIds.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAllFields}
                  className="text-gray-500 hover:text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.courseIds.map((id) => {
                const course = availableCourses.find((c) => c.id === id);
                return (
                  course && (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {course.mainTitle}
                      <button
                        type="button"
                        onClick={() => handleCourseSelect(id)}
                        className="text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#004aad] hover:bg-[#004aad]/90"
            disabled={loading}
          >
            {loading ? "Creating User..." : "Create User"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-200 text-green-800"
            >
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                User has been created successfully!
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
