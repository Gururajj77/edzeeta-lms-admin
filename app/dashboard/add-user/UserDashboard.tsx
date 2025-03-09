"use client";

import { useUserDashboard } from "./useUserDashboard";
import { ResetPasswordModal } from "./ResetPaswordModal";
import { EditCoursesModal } from "./EditCoursesModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function UserDashboard() {
  const {
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
  } = useUserDashboard();

  const getCourseNames = (courseIds: string[]) => {
    return courseIds
      .map((id) => courses.find((c) => c.id === id)?.mainTitle || "")
      .filter(Boolean);
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">User Management</CardTitle>
        <Button
          onClick={() => fetchUsers()}
          variant="outline"
          disabled={loading}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={clearError}
                className="ml-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 border-green-200 text-green-800"
          >
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004aad]"></div>
          </div>
        ) : (
          <>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Add a user to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getCourseNames(user.courseIds).map((name, i) => (
                              <Badge key={i} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                            {user.courseIds.length === 0 && (
                              <span className="text-gray-400 text-sm">
                                No courses
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? format(new Date(user.createdAt), "PPP")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                            >
                              Edit Courses
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openResetPasswordModal(user)}
                              className="border-amber-500 text-amber-500 hover:bg-amber-50"
                            >
                              Reset Password
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        <ResetPasswordModal
          user={selectedUser}
          isOpen={isResetPasswordModalOpen}
          onClose={closeResetPasswordModal}
          onSendResetEmail={sendPasswordResetEmail}
          isProcessing={processingAction}
        />

        <EditCoursesModal
          user={selectedUser}
          courses={courses}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onUpdateCourses={updateUserCourses}
          isProcessing={processingAction}
        />
      </CardContent>
    </Card>
  );
}
