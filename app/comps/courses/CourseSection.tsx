import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoveUp, MoveDown, Trash2 } from "lucide-react";
import { VideoSection, FormErrors } from "../../types/admin/course-creation";

interface CourseSectionProps {
  section: VideoSection;
  sectionIndex: number;
  totalSections: number;
  moduleId: string;
  errors?: FormErrors;
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

export const CourseSection: React.FC<CourseSectionProps> = ({
  section,
  sectionIndex,
  totalSections,
  moduleId,
  errors,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
}) => {
  return (
    <div className="pl-4 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Section Title"
          value={section.title}
          onChange={(e) =>
            onUpdateSection(moduleId, section.id, "title", e.target.value)
          }
          className={
            errors?.modules?.[moduleId]?.sections?.[section.id]?.title
              ? "border-red-500"
              : ""
          }
        />
        <Input
          placeholder="Video ID"
          value={section.videoId}
          onChange={(e) =>
            onUpdateSection(moduleId, section.id, "videoId", e.target.value)
          }
          className={
            errors?.modules?.[moduleId]?.sections?.[section.id]?.videoId
              ? "border-red-500"
              : ""
          }
        />
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSection(moduleId, section.id, "up")}
            disabled={sectionIndex === 0}
          >
            <MoveUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSection(moduleId, section.id, "down")}
            disabled={sectionIndex === totalSections - 1}
          >
            <MoveDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onRemoveSection(moduleId, section.id)}
            disabled={totalSections === 1}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        placeholder="Section Description"
        value={section.description}
        onChange={(e) =>
          onUpdateSection(moduleId, section.id, "description", e.target.value)
        }
      />
    </div>
  );
};
