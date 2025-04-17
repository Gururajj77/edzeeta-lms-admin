import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Users, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import { Project, ProjectCategory } from "@/app/types/projects/types";

interface ProjectsListProps {
  onEdit: (projectId: string) => void;
  onNew: () => void;
  onAssign: (projectId: string) => void;
  onViewSubmissions: (projectId: string) => void;
}

interface ProjectWithCategory extends Project {
  categoryTitle: string;
}

export default function ProjectsList({
  onEdit,
  onNew,
  onAssign,
  onViewSubmissions,
}: ProjectsListProps) {
  const [projects, setProjects] = useState<ProjectWithCategory[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "projectCategories");
        const snapshot = await getDocs(categoriesRef);

        const fetchedCategories: ProjectCategory[] = [];
        snapshot.forEach((doc) => {
          fetchedCategories.push({
            id: doc.id,
            ...doc.data(),
          } as ProjectCategory);
        });

        setCategories(fetchedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const projectsRef = collection(db, "projects");
        let projectsQuery = query(projectsRef);

        // Apply category filter if selected
        if (selectedCategory !== "all") {
          projectsQuery = query(
            projectsRef,
            where("categoryId", "==", selectedCategory)
          );
        }

        const snapshot = await getDocs(projectsQuery);

        const fetchedProjects: ProjectWithCategory[] = [];
        snapshot.forEach((doc) => {
          const projectData = doc.data() as Omit<Project, "id">;
          const category = categories.find(
            (cat) => cat.id === projectData.categoryId
          );

          fetchedProjects.push({
            id: doc.id,
            ...projectData,
            categoryTitle: category?.title || "Unknown Category",
          } as ProjectWithCategory);
        });

        // Apply search filter
        let filteredProjects = fetchedProjects;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredProjects = fetchedProjects.filter(
            (project) =>
              project.title.toLowerCase().includes(query) ||
              project.description.toLowerCase().includes(query)
          );
        }

        setProjects(filteredProjects);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch projects if categories are loaded
    if (categories.length > 0 || selectedCategory === "all") {
      fetchProjects();
    }
  }, [categories, selectedCategory, searchQuery]);

  // Handle project deletion
  const handleDelete = async (projectId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This will remove it from all students who have it assigned."
      )
    ) {
      return;
    }

    try {
      setDeleting(projectId);

      // Delete the project document
      await deleteDoc(doc(db, "projects", projectId));

      // Remove the project from the state
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading && projects.length === 0) {
    return <div className="py-4 text-center">Loading projects...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        {error}
        <Button
          className="ml-2"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Input
              placeholder="Search projects..."
              className="w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onNew}
          className="flex items-center gap-1 w-full sm:w-auto"
          style={{ backgroundColor: "#004aad" }}
        >
          <PlusCircle size={16} />
          <span>New Project</span>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-md">
          <p className="text-slate-500">
            {searchQuery || selectedCategory !== "all"
              ? "No projects match your filters"
              : "No projects found"}
          </p>
          {searchQuery || selectedCategory !== "all" ? (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2"
              style={{ color: "#004aad" }}
            >
              Clear filters
            </Button>
          ) : (
            <Button
              onClick={onNew}
              variant="link"
              className="mt-2"
              style={{ color: "#004aad" }}
            >
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.categoryTitle}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(project.id)}
                        title="Edit project"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAssign(project.id)}
                        title="Assign to users"
                      >
                        <Users size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewSubmissions(project.id)}
                        title="View submissions"
                      >
                        <FileText size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleDelete(project.id)}
                        disabled={deleting === project.id}
                        title="Delete project"
                      >
                        <Trash2 size={16} />
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
  );
}
