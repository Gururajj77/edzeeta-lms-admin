"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAddUser } from "./useAddUser";
import UserDashboard from "./UserDashboard";

export default function AddUserPage() {
  const [activeTab, setActiveTab] = useState("add");
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const {
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
  } = useAddUser();

  // Modified submit handler that also refreshes the dashboard
  const handleFormSubmit = async (e: React.FormEvent) => {
    await handleSubmit(e);

    // If no error occurred during submission, refresh dashboard and switch tabs
    if (!error) {
      setRefreshDashboard((prev) => prev + 1);
      setActiveTab("manage");
    }
  };

  return (
    <div className="container py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="add">Add User</TabsTrigger>
          <TabsTrigger value="manage">Manage Users</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
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
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      onClick={generatePassword}
                      className="text-sm bg-[#004aad] hover:bg-[#004aad]/90 text-white"
                    >
                      Generate Password
                    </Button>
                    {generatedPassword && (
                      <Button
                        type="button"
                        onClick={useGeneratedPassword}
                        className="text-sm bg-[#004aad] hover:bg-[#004aad]/90 text-white"
                      >
                        Use Generated Password
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={
                          formData.courseIds[formData.courseIds.length - 1] ||
                          ""
                        }
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
                        onClick={clearAllFields}
                        className="text-gray-500 hover:text-destructive bg-[#004aad] hover:bg-[#004aad]/90 text-white"
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
                  className="w-full bg-[#004aad] hover:bg-[#004aad]/90 text-white"
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
        </TabsContent>

        <TabsContent value="manage">
          <UserDashboard key={`dashboard-${refreshDashboard}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
