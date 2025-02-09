import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoveUp, MoveDown, Trash2, Plus } from "lucide-react";
import { CourseModule, FormErrors } from "../../types/admin/course-creation";
import { CourseSection } from "./CourseSection";

interface CourseModuleProps {
  module: CourseModule;
  moduleIndex: number;
  totalModules: number;
  errors?: FormErrors;
  onUpdateModule: (
    moduleId: string,
    field: keyof CourseModule,
    value: string
  ) => void;
  onAddSection: (moduleId: string) => void;
  onRemoveModule: (moduleId: string) => void;
  onMoveModule: (moduleId: string, direction: "up" | "down") => void;
  onUpdateSection: (
    moduleId: string,
    sectionId: string,
    field: string,
    value: string
  ) => void;
  onRemoveSection: (moduleId: string, sectionId: string) => void;
  onMoveSection: (
    moduleId: string,
    sectionId: string,
    direction: "up" | "down"
  ) => void;
}

export const CourseModuleComponent: React.FC<CourseModuleProps> = ({
  module,
  moduleIndex,
  totalModules,
  errors,
  onUpdateModule,
  onAddSection,
  onRemoveModule,
  onMoveModule,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
}) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Module Name"
            value={module.moduleName}
            onChange={(e) =>
              onUpdateModule(module.id, "moduleName", e.target.value)
            }
            className={
              errors?.modules?.[module.id]?.moduleName ? "border-red-500" : ""
            }
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onMoveModule(module.id, "up")}
              disabled={moduleIndex === 0}
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onMoveModule(module.id, "down")}
              disabled={moduleIndex === totalModules - 1}
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="text-red-500"
                  disabled={totalModules === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Module</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this module? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemoveModule(module.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Textarea
          placeholder="Module Description"
          value={module.description}
          onChange={(e) =>
            onUpdateModule(module.id, "description", e.target.value)
          }
        />

        {module.sections.map((section, sectionIndex) => (
          <CourseSection
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            totalSections={module.sections.length}
            moduleId={module.id}
            errors={errors}
            onUpdateSection={onUpdateSection}
            onRemoveSection={onRemoveSection}
            onMoveSection={onMoveSection}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddSection(module.id)}
          className="w-full mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </Card>
  );
};
