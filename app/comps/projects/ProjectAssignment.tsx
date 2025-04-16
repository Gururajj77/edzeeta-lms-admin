import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Check, Users } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import { Project, UserProject } from "@/app/types/projects/types";

interface ProjectAssignmentProps {
  selectedProjectId: string | null;
  onComplete: () => void;
}

interface User {
  id: string;
  email: string;
  courseIds: string[];
}

export default function ProjectAssignment({
  selectedProjectId,
  onComplete,
}: ProjectAssignmentProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentProjectId, setCurrentProjectId] = useState<string>(
    selectedProjectId || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(
    new Set()
  );

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const snapshot = await getDocs(projectsRef);

        const fetchedProjects: Project[] = [];
        snapshot.forEach((doc) => {
          fetchedProjects.push({
            id: doc.id,
            ...doc.data(),
          } as Project);
        });

        setProjects(fetchedProjects);

        // Set the first project as selected if none is provided
        if (
          !selectedProjectId &&
          fetchedProjects.length > 0 &&
          !currentProjectId
        ) {
          setCurrentProjectId(fetchedProjects[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, [selectedProjectId, currentProjectId]);

  // Fetch users
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

        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch existing assignments when project changes
  useEffect(() => {
    const fetchExistingAssignments = async () => {
      if (!currentProjectId) return;

      try {
        setLoading(true);

        const userProjectsRef = collection(db, "userProjects");
        const assignmentQuery = query(
          userProjectsRef,
          where("projectId", "==", currentProjectId)
        );
        const snapshot = await getDocs(assignmentQuery);

        const assignments = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data() as UserProject;
          assignments.add(data.userId);
        });

        setExistingAssignments(assignments);
        setSelectedUsers(assignments);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentProjectId) {
      fetchExistingAssignments();
    }
  }, [currentProjectId]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(query)
    );

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Handle project selection change
  const handleProjectChange = (projectId: string) => {
    setCurrentProjectId(projectId);
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

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      // If all are selected, deselect all
      setSelectedUsers(new Set());
    } else {
      // Otherwise, select all filtered users
      const newSelectedUsers = new Set<string>();
      filteredUsers.forEach((user) => {
        newSelectedUsers.add(user.id);
      });
      setSelectedUsers(newSelectedUsers);
    }
  };

  // Save assignments
  const handleSaveAssignments = async () => {
    if (!currentProjectId) {
      alert("Please select a project");
      return;
    }

    try {
      setSaving(true);

      // Determine users to add and remove
      const usersToAdd = Array.from(selectedUsers).filter(
        (userId) => !existingAssignments.has(userId)
      );
      const usersToRemove = Array.from(existingAssignments).filter(
        (userId) => !selectedUsers.has(userId)
      );

      // Add new assignments
      for (const userId of usersToAdd) {
        await addDoc(collection(db, "userProjects"), {
          userId,
          projectId: currentProjectId,
          assignedAt: new Date().toISOString(),
        });
      }

      // Remove existing assignments
      const userProjectsRef = collection(db, "userProjects");
      for (const userId of usersToRemove) {
        const assignmentQuery = query(
          userProjectsRef,
          where("projectId", "==", currentProjectId),
          where("userId", "==", userId)
        );
        const snapshot = await getDocs(assignmentQuery);

        snapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }

      // Update existing assignments set
      setExistingAssignments(new Set(selectedUsers));

      alert("Project assignments updated successfully!");
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Failed to update project assignments. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Find project name
  const getProjectName = () => {
    const project = projects.find((p) => p.id === currentProjectId);
    return project ? project.title : "Select a project";
  };

  // Calculate metrics
  const assignedUsersCount = selectedUsers.size;
  const totalUsersCount = users.length;

  return (
    <div className="space-y-6">
      {/* Project selection */}
      <div className="grid gap-2">
        <Label htmlFor="project">Select Project to Assign</Label>
        <Select value={currentProjectId} onValueChange={handleProjectChange}>
          <SelectTrigger id="project">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentProjectId && (
        <>
          {/* Assignment info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-medium text-lg mb-2">{getProjectName()}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users size={16} />
                <span>
                  {assignedUsersCount} of {totalUsersCount} users assigned
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveAssignments}
                style={{ backgroundColor: "#004aad" }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Assignments"}
              </Button>
            </div>
          </div>

          {/* User search and list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search users by email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="hidden sm:flex items-center gap-1"
              >
                <Checkbox
                  checked={
                    selectedUsers.size > 0 &&
                    selectedUsers.size === filteredUsers.length
                  }
                  className="mr-1"
                />
                {selectedUsers.size === filteredUsers.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
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
                            selectedUsers.size === filteredUsers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
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
                          {existingAssignments.has(user.id) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check size={12} className="mr-1" />
                              Assigned
                            </span>
                          ) : selectedUsers.has(user.id) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onComplete} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAssignments}
              style={{ backgroundColor: "#004aad" }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
