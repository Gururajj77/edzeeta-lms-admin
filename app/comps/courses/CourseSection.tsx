import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoveUp, MoveDown, Trash2, Plus } from "lucide-react";
import {
  VideoSection,
  FormErrors,
  Video,
} from "../../types/admin/course-creation";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
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
  // Initialize videos array if it doesn't exist
  const videos: Video[] = section.videos || [];

  // For backward compatibility - if only videoId exists but no videos array
  const hasLegacyVideoId = !section.videos && section.videoId;

  // Add a new video to the section
  const addVideo = () => {
    const updatedVideos = [...videos, { id: "", duration: 0 }];
    onUpdateSection(moduleId, section.id, "videos", updatedVideos);
  };

  // Remove a video from the section
  const removeVideo = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    onUpdateSection(moduleId, section.id, "videos", updatedVideos);
  };

  // Update a specific video's property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateVideo = (index: number, field: string, value: any) => {
    const updatedVideos = videos.map((video, i) => {
      if (i === index) {
        return { ...video, [field]: value };
      }
      return video;
    });
    onUpdateSection(moduleId, section.id, "videos", updatedVideos);
  };

  // Handle legacy videoId update
  const handleLegacyVideoIdUpdate = (value: string) => {
    onUpdateSection(moduleId, section.id, "videoId", value);
  };

  // Migrate from legacy videoId to videos array
  const migrateToVideosArray = () => {
    if (section.videoId) {
      onUpdateSection(moduleId, section.id, "videos", [
        { id: section.videoId, duration: 0 },
      ]);
      onUpdateSection(moduleId, section.id, "videoId", undefined);
    }
  };

  return (
    <div className="pl-4 space-y-3">
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

      {/* Legacy single videoId field - show if no videos array exists */}
      {hasLegacyVideoId && (
        <div className="flex justify-between items-center">
          <div className="flex-1 mr-2">
            <Input
              placeholder="Video ID"
              value={section.videoId}
              onChange={(e) => handleLegacyVideoIdUpdate(e.target.value)}
              className={
                errors?.modules?.[moduleId]?.sections?.[section.id]?.videoId
                  ? "border-red-500"
                  : ""
              }
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={migrateToVideosArray}
          >
            Enable Multiple Videos
          </Button>
        </div>
      )}

      {/* New multi-video UI */}
      {!hasLegacyVideoId && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Videos</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVideo}
              className="flex items-center text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Video
            </Button>
          </div>

          {videos.length === 0 && (
            <div className="text-sm text-gray-500 italic py-2">
              No videos added. Add a video to this section.
            </div>
          )}

          {videos.map((video, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Video ID"
                value={video.id}
                onChange={(e) => updateVideo(index, "id", e.target.value)}
                className={
                  errors?.modules?.[moduleId]?.sections?.[section.id]?.videos?.[
                    index
                  ]?.id
                    ? "border-red-500"
                    : ""
                }
              />
              <Input
                placeholder="Duration (sec)"
                type="number"
                min="0"
                value={video.duration || ""}
                onChange={(e) =>
                  updateVideo(index, "duration", parseInt(e.target.value) || 0)
                }
                className="max-w-[120px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVideo(index)}
                className="text-red-500 h-8 w-8"
                disabled={videos.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
