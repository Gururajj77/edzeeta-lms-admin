"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { CourseModuleComponent } from "@/app/comps/courses/CourseModule";
import {
  NewCourse,
  FormErrors,
  CourseModule,
} from "../../types/admin/course-creation";
import { useToast } from "@/hooks/use-toast";

export default function CreateCoursePage() {
  const { toast } = useToast();

  const [courseData, setCourseData] = useState<NewCourse>({
    mainTitle: "",
    description: "",
    modules: [
      {
        id: uuidv4(),
        moduleName: "",
        description: "",
        order: 0,
        sections: [
          {
            id: uuidv4(),
            title: "",
            videoId: "",
            description: "",
            order: 0,
          },
        ],
      },
    ],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      modules: {}, // Initialize the modules object
    };

    if (!courseData.mainTitle.trim()) {
      newErrors.mainTitle = "Course title is required";
    }

    courseData.modules.forEach((module) => {
      // Initialize the module object if it doesn't exist
      if (!newErrors.modules![module.id]) {
        newErrors.modules![module.id] = {
          sections: {}, // Initialize the sections object for this module
        };
      }

      if (!module.moduleName.trim()) {
        newErrors.modules![module.id].moduleName = "Module name is required";
      }

      module.sections.forEach((section) => {
        // Initialize the sections object if it doesn't exist
        if (!newErrors.modules![module.id].sections) {
          newErrors.modules![module.id].sections = {};
        }

        if (!section.title.trim() || !section.videoId.trim()) {
          newErrors.modules![module.id].sections![section.id] = {
            title: !section.title.trim()
              ? "Section title is required"
              : undefined,
            videoId: !section.videoId.trim()
              ? "Video ID is required"
              : undefined,
          };
        }
      });
    });

    // Clean up empty objects
    courseData.modules.forEach((module) => {
      if (
        !newErrors.modules![module.id].moduleName &&
        (!newErrors.modules![module.id].sections ||
          Object.keys(newErrors.modules![module.id].sections!).length === 0)
      ) {
        delete newErrors.modules![module.id];
      }
    });

    if (Object.keys(newErrors.modules!).length === 0) {
      delete newErrors.modules;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/courses/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || "Failed to create course");
      }

      // Show success message
      toast({
        title: "Success!",
        description: "Course created successfully",
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateModule = (
    moduleId: string,
    field: keyof CourseModule,
    value: string
  ) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleAddModule = () => {
    setCourseData((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: uuidv4(),
          moduleName: "",
          description: "",
          order: prev.modules.length,
          sections: [
            {
              id: uuidv4(),
              title: "",
              videoId: "",
              description: "",
              order: 0,
            },
          ],
        },
      ],
    }));
  };

  const handleAddSection = (moduleId: string) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              sections: [
                ...module.sections,
                {
                  id: uuidv4(),
                  title: "",
                  videoId: "",
                  description: "",
                  order: module.sections.length,
                },
              ],
            }
          : module
      ),
    }));
  };

  const handleRemoveModule = (moduleId: string) => {
    if (courseData.modules.length === 1) return;
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules
        .filter((module) => module.id !== moduleId)
        .map((module, index) => ({ ...module, order: index })),
    }));
  };

  const handleRemoveSection = (moduleId: string, sectionId: string) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              sections:
                module.sections.length > 1
                  ? module.sections
                      .filter((section) => section.id !== sectionId)
                      .map((section, index) => ({ ...section, order: index }))
                  : module.sections,
            }
          : module
      ),
    }));
  };

  const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
    const moduleIndex = courseData.modules.findIndex((m) => m.id === moduleId);
    if (
      (direction === "up" && moduleIndex === 0) ||
      (direction === "down" && moduleIndex === courseData.modules.length - 1)
    )
      return;

    const newModules = [...courseData.modules];
    const swapIndex = direction === "up" ? moduleIndex - 1 : moduleIndex + 1;
    [newModules[moduleIndex], newModules[swapIndex]] = [
      newModules[swapIndex],
      newModules[moduleIndex],
    ];

    setCourseData((prev) => ({
      ...prev,
      modules: newModules.map((module, index) => ({ ...module, order: index })),
    }));
  };

  const handleMoveSection = (
    moduleId: string,
    sectionId: string,
    direction: "up" | "down"
  ) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) return module;

        const sectionIndex = module.sections.findIndex(
          (s) => s.id === sectionId
        );
        if (
          (direction === "up" && sectionIndex === 0) ||
          (direction === "down" && sectionIndex === module.sections.length - 1)
        )
          return module;

        const newSections = [...module.sections];
        const swapIndex =
          direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
        [newSections[sectionIndex], newSections[swapIndex]] = [
          newSections[swapIndex],
          newSections[sectionIndex],
        ];

        return {
          ...module,
          sections: newSections.map((section, index) => ({
            ...section,
            order: index,
          })),
        };
      }),
    }));
  };

  const handleUpdateSection = (
    moduleId: string,
    sectionId: string,
    field: string,
    value: string
  ) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              sections: m.sections.map((s) =>
                s.id === sectionId ? { ...s, [field]: value } : s
              ),
            }
          : m
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Course Title"
                value={courseData.mainTitle}
                onChange={(e) =>
                  setCourseData((prev) => ({
                    ...prev,
                    mainTitle: e.target.value,
                  }))
                }
                className={errors.mainTitle ? "border-red-500" : ""}
              />
              {errors.mainTitle && (
                <p className="text-red-500 text-sm mt-1">{errors.mainTitle}</p>
              )}
            </div>

            <Textarea
              placeholder="Course Description"
              value={courseData.description}
              onChange={(e) =>
                setCourseData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            {courseData.modules.map((module, moduleIndex) => (
              <CourseModuleComponent
                key={module.id}
                module={module}
                moduleIndex={moduleIndex}
                totalModules={courseData.modules.length}
                errors={errors}
                onUpdateModule={handleUpdateModule}
                onAddSection={handleAddSection}
                onRemoveModule={handleRemoveModule}
                onMoveModule={handleMoveModule}
                onUpdateSection={handleUpdateSection}
                onRemoveSection={handleRemoveSection}
                onMoveSection={handleMoveSection}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddModule}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#004AAD] hover:bg-[#004AAD]/90"
        >
          {isSubmitting ? "Creating Course..." : "Create Course"}
        </Button>
      </div>
    </form>
  );
}
