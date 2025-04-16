"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import components for each section
import CategoriesList from "@/app/comps/projects/CategoriesList";
import CategoryForm from "@/app/comps/projects/CategoryForm";
import ProjectsList from "@/app/comps/projects/ProjectsList";
import ProjectForm from "@/app/comps/projects/ProjectForm";
import ProjectAssignment from "@/app/comps/projects/ProjectAssignment";

export default function ProjectsPage() {
  // State for tracking which item is being edited
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // States for active tab
  const [activeTab, setActiveTab] = useState("categories-list");

  // Function to handle editing a category
  const handleEditCategory = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setActiveTab("category-form");
  };

  // Function to handle editing a project
  const handleEditProject = (projectId: string) => {
    setEditingProjectId(projectId);
    setActiveTab("project-form");
  };

  // Function to handle creating a new category
  const handleNewCategory = () => {
    setEditingCategoryId(null);
    setActiveTab("category-form");
  };

  // Function to handle creating a new project
  const handleNewProject = () => {
    setEditingProjectId(null);
    setActiveTab("project-form");
  };

  // Function to handle assigning a project
  const handleAssignProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab("project-assignment");
  };

  // Function to handle form submission completion
  const handleFormComplete = () => {
    // Reset the editing state
    setEditingCategoryId(null);
    setEditingProjectId(null);

    // Return to the list view
    if (activeTab === "category-form") {
      setActiveTab("categories-list");
    } else if (activeTab === "project-form") {
      setActiveTab("projects-list");
    } else if (activeTab === "project-assignment") {
      setActiveTab("projects-list");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Projects Management</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="categories-list">Categories</TabsTrigger>
          <TabsTrigger value="category-form">
            {editingCategoryId ? "Edit Category" : "New Category"}
          </TabsTrigger>
          <TabsTrigger value="projects-list">Projects</TabsTrigger>
          <TabsTrigger value="project-form">
            {editingProjectId ? "Edit Project" : "New Project"}
          </TabsTrigger>
          <TabsTrigger value="project-assignment">Assign Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="categories-list">
          <Card>
            <CardHeader>
              <CardTitle>Project Categories</CardTitle>
              <CardDescription>
                Manage the categories that contain projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesList
                onEdit={handleEditCategory}
                onNew={handleNewCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category-form">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingCategoryId ? "Edit Category" : "Create New Category"}
              </CardTitle>
              <CardDescription>
                {editingCategoryId
                  ? "Edit the details of an existing category"
                  : "Create a new project category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm
                categoryId={editingCategoryId}
                onComplete={handleFormComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects-list">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Manage all projects in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsList
                onEdit={handleEditProject}
                onNew={handleNewProject}
                onAssign={handleAssignProject}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-form">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProjectId ? "Edit Project" : "Create New Project"}
              </CardTitle>
              <CardDescription>
                {editingProjectId
                  ? "Edit the details of an existing project"
                  : "Create a new project for students"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm
                projectId={editingProjectId}
                onComplete={handleFormComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-assignment">
          <Card>
            <CardHeader>
              <CardTitle>Assign Projects to Users</CardTitle>
              <CardDescription>
                Manage which users have access to specific projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectAssignment
                selectedProjectId={selectedProjectId}
                onComplete={handleFormComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
