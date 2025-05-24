/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Check,
  Users,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc as firebaseDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import {
  Project,
  ProjectCategory,
  UserProject,
} from "@/app/types/projects/types";

interface BulkProjectAssignmentProps {
  onComplete: () => void;
}

interface User {
  id: string;
  email: string;
  courseIds: string[];
}

interface Course {
  id: string;
  mainTitle: string;
}

interface ProjectWithCategory extends Project {
  categoryTitle: string;
}

interface UserWithCourses extends User {
  courses: Course[];
}

export default function BulkProjectAssignment({
  onComplete,
}: BulkProjectAssignmentProps) {
  const [projects, setProjects] = useState<ProjectWithCategory[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [users, setUsers] = useState<UserWithCourses[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithCourses[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [existingAssignments, setExistingAssignments] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortedUsers, setSortedUsers] = useState<UserWithCourses[]>([]);

  // Fetch courses first
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);

        const fetchedCourses: Course[] = [];
        coursesSnapshot.forEach((doc) => {
          fetchedCourses.push({
            id: doc.id,
            mainTitle: doc.data().mainTitle,
          } as Course);
        });

        setCourses(fetchedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, []);

  // Fetch categories and projects
  useEffect(() => {
    const fetchCategoriesAndProjects = async () => {
      try {
        // Fetch categories first
        const categoriesRef = collection(db, "projectCategories");
        const categoriesSnapshot = await getDocs(categoriesRef);

        const fetchedCategories: ProjectCategory[] = [];
        categoriesSnapshot.forEach((doc) => {
          fetchedCategories.push({
            id: doc.id,
            ...doc.data(),
          } as ProjectCategory);
        });

        setCategories(fetchedCategories);

        // Fetch projects
        const projectsRef = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsRef);

        const fetchedProjects: ProjectWithCategory[] = [];
        projectsSnapshot.forEach((doc) => {
          const projectData = doc.data() as Omit<Project, "id">;
          const category = fetchedCategories.find(
            (cat) => cat.id === projectData.categoryId
          );

          fetchedProjects.push({
            id: doc.id,
            ...projectData,
            categoryTitle: category?.title || "Unknown Category",
          } as ProjectWithCategory);
        });

        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error fetching projects and categories:", err);
      }
    };

    fetchCategoriesAndProjects();
  }, []);

  // Fetch users and map them with course names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const fetchedUsers: User[] = [];
        snapshot.forEach((doc) => {
          fetchedUsers.push({
            id: doc.id,
            ...doc.data(),
          } as User);
        });

        // Map users with their course information
        const usersWithCourses: UserWithCourses[] = fetchedUsers.map((user) => {
          const userCourses =
            user.courseIds
              ?.map((courseId) =>
                courses.find((course) => course.id === courseId)
              )
              .filter((course): course is Course => course !== undefined) || [];

          return {
            ...user,
            courses: userCourses,
          };
        });

        setUsers(usersWithCourses);
        setFilteredUsers(usersWithCourses);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch users if courses are already loaded
    if (courses.length > 0) {
      fetchUsers();
    }
  }, [courses]);

  // Fetch existing assignments for selected projects
  useEffect(() => {
    const fetchExistingAssignments = async () => {
      if (selectedProjects.size === 0) {
        setExistingAssignments(new Map());
        return;
      }

      try {
        const userProjectsRef = collection(db, "userProjects");
        const assignmentQuery = query(
          userProjectsRef,
          where("projectId", "in", Array.from(selectedProjects))
        );
        const snapshot = await getDocs(assignmentQuery);

        const assignmentMap = new Map<string, Set<string>>();

        snapshot.forEach((doc) => {
          const data = doc.data() as UserProject;
          if (!assignmentMap.has(data.projectId)) {
            assignmentMap.set(data.projectId, new Set());
          }
          assignmentMap.get(data.projectId)!.add(data.userId);
        });

        setExistingAssignments(assignmentMap);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };

    fetchExistingAssignments();
  }, [selectedProjects]);

  // Filter and sort users based on search query and sort direction
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.courses.some((course) =>
            course.mainTitle.toLowerCase().includes(query)
          )
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortDirection === "asc") {
        return a.email.localeCompare(b.email);
      } else {
        return b.email.localeCompare(a.email);
      }
    });

    setFilteredUsers(filtered);
    setSortedUsers(sorted);
  }, [searchQuery, users, sortDirection]);

  // Handle project selection toggle
  const handleProjectToggle = (projectId: string) => {
    const newSelectedProjects = new Set(selectedProjects);

    if (newSelectedProjects.has(projectId)) {
      newSelectedProjects.delete(projectId);
    } else {
      newSelectedProjects.add(projectId);
    }

    setSelectedProjects(newSelectedProjects);
  };

  // Handle user selection toggle
  const handleUserToggle = (userId: string) => {
    const newSelectedUsers = new Set(selectedUsers);

    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }

    setSelectedUsers(newSelectedUsers);
  };

  // Handle select all projects
  const handleSelectAllProjects = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)));
    }
  };

  // Handle sort direction toggle
  const handleSortToggle = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Handle select all users (use sortedUsers for consistency)
  const handleSelectAllUsers = () => {
    if (selectedUsers.size === sortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(sortedUsers.map((u) => u.id)));
    }
  };

  // Get detailed assignment status for user
  const getUserAssignmentDetails = (userId: string) => {
    const isSelected = selectedUsers.has(userId);
    const assignedProjects = Array.from(selectedProjects).filter((projectId) =>
      existingAssignments.get(projectId)?.has(userId)
    );
    const isAssignedToAny = assignedProjects.length > 0;
    const isAssignedToAll = assignedProjects.length === selectedProjects.size;

    return {
      isSelected,
      isAssignedToAny,
      isAssignedToAll,
      assignedProjects,
      totalSelectedProjects: selectedProjects.size,
    };
  };

  // Get assignment status for user
  const getUserAssignmentStatus = (userId: string) => {
    const details = getUserAssignmentDetails(userId);
    const { isSelected, isAssignedToAny, isAssignedToAll } = details;

    if (isAssignedToAll && isSelected) return "assigned-all";
    if (isAssignedToAny && isSelected && !isAssignedToAll)
      return "assigned-partial";
    if (isAssignedToAny && !isSelected) return "will-remove";
    if (!isAssignedToAny && isSelected) return "will-assign";
    return "unassigned";
  };

  // Check if there are any changes to be made
  const hasChangesToApply = () => {
    if (selectedProjects.size === 0) return false;

    for (const projectId of selectedProjects) {
      const currentAssignments =
        existingAssignments.get(projectId) || new Set();

      // Check if there are users to add (selected but not currently assigned)
      const usersToAdd = Array.from(selectedUsers).filter(
        (userId) => !currentAssignments.has(userId)
      );

      // Check if there are users to remove (currently assigned but not selected)
      const usersToRemove = Array.from(currentAssignments).filter(
        (userId) => !selectedUsers.has(userId)
      );

      // If there are any additions or removals, we have changes
      if (usersToAdd.length > 0 || usersToRemove.length > 0) {
        return true;
      }
    }

    return false;
  };

  const handleSaveBulkAssignments = async () => {
    if (selectedProjects.size === 0) {
      alert("Please select at least one project");
      return;
    }

    try {
      setSaving(true);
      const batch = writeBatch(db);
      let addCount = 0;
      let removeCount = 0;

      // Process each project-user combination
      for (const projectId of selectedProjects) {
        const currentAssignments =
          existingAssignments.get(projectId) || new Set();

        // Users to add for this project (selected users who aren't currently assigned)
        const usersToAdd = Array.from(selectedUsers).filter(
          (userId) => !currentAssignments.has(userId)
        );

        // Users to remove for this project (currently assigned users who aren't selected)
        const usersToRemove = Array.from(currentAssignments).filter(
          (userId) => !selectedUsers.has(userId)
        );

        // Add new assignments
        for (const userId of usersToAdd) {
          const docRef = firebaseDoc(collection(db, "userProjects"));
          batch.set(docRef, {
            userId,
            projectId,
            assignedAt: new Date().toISOString(),
          });
          addCount++;
        }

        // Remove existing assignments that are no longer selected
        if (usersToRemove.length > 0) {
          const removeQuery = query(
            collection(db, "userProjects"),
            where("projectId", "==", projectId),
            where("userId", "in", usersToRemove)
          );
          const removeSnapshot = await getDocs(removeQuery);

          removeSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            removeCount++;
          });
        }
      }

      await batch.commit();

      // Update existing assignments state
      const newAssignments = new Map(existingAssignments);
      for (const projectId of selectedProjects) {
        newAssignments.set(projectId, new Set(selectedUsers));
      }
      setExistingAssignments(newAssignments);

      // Show detailed success message
      let message = "Successfully updated project assignments!";
      if (addCount > 0 && removeCount > 0) {
        message = `Successfully added ${addCount} and removed ${removeCount} assignments!`;
      } else if (addCount > 0) {
        message = `Successfully added ${addCount} new assignments!`;
      } else if (removeCount > 0) {
        message = `Successfully removed ${removeCount} assignments!`;
      }

      alert(message);
    } catch (err) {
      console.error("Error saving bulk assignments:", err);
      alert("Failed to update project assignments. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Select Projects
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllProjects}
              className="flex items-center gap-1"
            >
              <Checkbox
                checked={
                  selectedProjects.size > 0 &&
                  selectedProjects.size === projects.length
                }
                className="mr-1"
              />
              {selectedProjects.size === projects.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedProjects.has(project.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleProjectToggle(project.id)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProjects.has(project.id)}
                    onChange={() => handleProjectToggle(project.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-100 text-slate-600 border-slate-300"
                      >
                        {project.categoryTitle}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedProjects.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedProjects.size}</strong> projects selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Summary */}
      {selectedProjects.size > 0 && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-medium text-lg mb-2">Assignment Summary</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users size={16} />
              <span>
                {selectedUsers.size} users selected for {selectedProjects.size}{" "}
                projects
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleSaveBulkAssignments}
              style={{ backgroundColor: "#004aad" }}
              disabled={
                saving || selectedProjects.size === 0 || !hasChangesToApply()
              }
            >
              {saving ? "Saving..." : "Apply Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* User Selection */}
      {selectedProjects.size > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search users by email or course..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllUsers}
              className="hidden sm:flex items-center gap-1"
            >
              <Checkbox
                checked={
                  selectedUsers.size > 0 &&
                  selectedUsers.size === sortedUsers.length
                }
                className="mr-1"
              />
              {selectedUsers.size === sortedUsers.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-md">
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedUsers.size > 0 &&
                          selectedUsers.size === sortedUsers.length
                        }
                        onCheckedChange={handleSelectAllUsers}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={handleSortToggle}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors font-medium"
                      >
                        Email
                        {sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Enrolled Courses</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => {
                    const status = getUserAssignmentStatus(user.id);

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.courses.length > 0 ? (
                              user.courses.map((course) => (
                                <Badge
                                  key={course.id}
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                                >
                                  <BookOpen size={10} />
                                  {course.mainTitle}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                No courses assigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {status === "assigned-all" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check size={12} className="mr-1" />
                              Assigned to All
                            </span>
                          )}
                          {status === "assigned-partial" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Check size={12} className="mr-1" />
                              Partially Assigned
                            </span>
                          )}
                          {status === "will-assign" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Plus size={12} className="mr-1" />
                              Will Assign
                            </span>
                          )}
                          {status === "will-remove" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X size={12} className="mr-1" />
                              Will Remove
                            </span>
                          )}
                          {status === "unassigned" && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onComplete} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveBulkAssignments}
          style={{ backgroundColor: "#004aad" }}
          disabled={
            saving || selectedProjects.size === 0 || !hasChangesToApply()
          }
        >
          {saving ? "Saving..." : "Apply Changes"}
        </Button>
      </div>
    </div>
  );
}
