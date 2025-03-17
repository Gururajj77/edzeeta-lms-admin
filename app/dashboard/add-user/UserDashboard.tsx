"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { useUserDashboard } from "./useUserDashboard";
import { EditCoursesModal } from "./EditCoursesModal";
import { DeleteUserModal } from "./DeleteUserModal"; // Import the new component

export default function UserDashboard() {
  const {
    users,
    courses,
    loading,
    error,
    selectedUser,
    isEditModalOpen,
    isDeleteModalOpen, // Add this
    processingAction,
    successMessage,
    fetchUsers,
    openEditModal,
    closeEditModal,
    openDeleteModal, // Add this
    closeDeleteModal, // Add this
    updateUserCourses,
    deleteUser, // Add this
    clearError,
  } = useUserDashboard();

  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get course title by ID
  const getCourseTitle = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.mainTitle : "Unknown Course";
  };

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              User Management
            </CardTitle>
          </div>
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Success message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert
              variant="destructive"
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-6 px-2"
              >
                Dismiss
              </Button>
            </Alert>
          )}

          {/* Users table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-2" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-md bg-gray-50">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Email</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead className="w-1/6">Created</TableHead>
                    <TableHead className="text-right w-1/6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.courseIds && user.courseIds.length > 0 ? (
                            user.courseIds.map((courseId) => (
                              <Badge
                                key={courseId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {getCourseTitle(courseId)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">
                              No courses assigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="h-8 px-2 flex items-center"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>

                          {/* Add Delete button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            className="h-8 px-2 flex items-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Courses Modal */}
      <EditCoursesModal
        user={selectedUser}
        courses={courses}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onUpdateCourses={updateUserCourses}
        isProcessing={processingAction}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        user={selectedUser}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDeleteUser={deleteUser}
        isProcessing={processingAction}
      />
    </Card>
  );
}
