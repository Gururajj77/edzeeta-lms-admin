import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "./useUserDashboard";

interface Course {
  id: string;
  mainTitle: string;
}

interface EditCoursesModalProps {
  user: User | null;
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateCourses: (courseIds: string[]) => Promise<void>;
  isProcessing: boolean;
}

export function EditCoursesModal({
  user,
  courses,
  isOpen,
  onClose,
  onUpdateCourses,
  isProcessing,
}: EditCoursesModalProps) {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setSelectedCourseIds(user.courseIds || []);
    }
  }, [user]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleSubmit = async () => {
    await onUpdateCourses(selectedCourseIds);
  };

  const handleClose = () => {
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Courses for {user.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select
              value={selectedCourseIds[selectedCourseIds.length - 1] || ""}
              onValueChange={handleCourseSelect}
              disabled={isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select courses" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem
                    key={course.id}
                    value={course.id}
                    className={
                      selectedCourseIds.includes(course.id) ? "bg-accent" : ""
                    }
                  >
                    {course.mainTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCourseIds.map((id) => {
              const course = courses.find((c) => c.id === id);
              return (
                course && (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {course.mainTitle}
                    <button
                      type="button"
                      onClick={() => handleCourseSelect(id)}
                      className="text-xs hover:text-destructive"
                      disabled={isProcessing}
                    >
                      ×
                    </button>
                  </Badge>
                )
              );
            })}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#004aad] hover:bg-[#004aad]/90 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? "Updating..." : "Update Courses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
