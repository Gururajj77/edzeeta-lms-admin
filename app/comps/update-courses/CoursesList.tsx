import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Video as VidIcon,
  Clock,
  Edit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import {
  Course,
  CourseModule,
  VideoSection,
  Video,
} from "../../types/admin/course-creation";
import { updateCourse, deleteCourse } from "@/app/actions/courseActions";

const CoursesList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Function to fetch courses from API
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/courses/update");
      const data = await response.json();

      if (data.courses) {
        setCourses(data.courses);
      } else {
        setError("Failed to fetch courses");
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to save course updates
  const saveCourseUpdates = async () => {
    if (!editingCourse) return;

    setSaving(true);
    try {
      // Use the server action directly
      const result = await updateCourse(editingCourse.id, editingCourse);

      if (result.success) {
        // Update the courses list with the edited course
        setCourses(
          courses.map((course) =>
            course.id === editingCourse.id ? editingCourse : course
          )
        );

        setNotification({
          type: "success",
          message: "Course updated successfully!",
        });

        // Close modal after a short delay
        setTimeout(() => {
          setIsModalOpen(false);
          setNotification(null);
        }, 1500);
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to update course",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "Error connecting to the server",
      });
    } finally {
      setSaving(false);
    }
  };

  // Function to handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteCourse(courseToDelete.id);

      if (result.success) {
        // Remove the course from the list
        setCourses(courses.filter((course) => course.id !== courseToDelete.id));

        // Show success notification
        setNotification({
          type: "success",
          message: "Course deleted successfully!",
        });

        // Close the delete dialog
        setIsDeleteDialogOpen(false);
        setCourseToDelete(null);

        // Clear the notification after delay
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to delete course",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "Error connecting to the server",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (course: Course, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Function to filter courses based on search query
  const filteredCourses = courses.filter(
    (course) =>
      course.mainTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Count total videos in a section
  const countVideos = (section: VideoSection): number => {
    return section.videos?.length || 0;
  };

  // Calculate total duration of videos in a section
  const calculateSectionDuration = (section: VideoSection): number => {
    return (
      section.videos?.reduce(
        (total, video) => total + (video.duration || 0),
        0
      ) || 0
    );
  };

  // Handle opening edit modal for a course
  const handleEditCourse = (course: Course) => {
    setEditingCourse(JSON.parse(JSON.stringify(course))); // Create a deep copy
    setActiveTab("general");
    setIsModalOpen(true);
  };

  // Update module name or description
  const updateModule = (
    moduleId: string,
    field: keyof CourseModule,
    value: string
  ) => {
    if (!editingCourse) return;

    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((module) =>
        module.id === moduleId ? { ...module, [field]: value } : module
      ),
    });
  };

  // Update section title or description
  const updateSection = (
    moduleId: string,
    sectionId: string,
    field: keyof VideoSection,
    value: string
  ) => {
    if (!editingCourse) return;

    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            sections: module.sections.map((section) =>
              section.id === sectionId
                ? { ...section, [field]: value }
                : section
            ),
          };
        }
        return module;
      }),
    });
  };

  // Update video properties
  const updateVideo = (
    moduleId: string,
    sectionId: string,
    videoIndex: number,
    field: keyof Video,
    value: string | number
  ) => {
    if (!editingCourse) return;

    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            sections: module.sections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  videos: section.videos.map((video, index) =>
                    index === videoIndex ? { ...video, [field]: value } : video
                  ),
                };
              }
              return section;
            }),
          };
        }
        return module;
      }),
    });
  };

  // Add a new video to a section
  const addVideo = (moduleId: string, sectionId: string) => {
    if (!editingCourse) return;

    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            sections: module.sections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  videos: [
                    ...section.videos,
                    { id: "", name: "", duration: 0 },
                  ],
                };
              }
              return section;
            }),
          };
        }
        return module;
      }),
    });
  };

  // Remove a video from a section
  const removeVideo = (
    moduleId: string,
    sectionId: string,
    videoIndex: number
  ) => {
    if (!editingCourse) return;

    setEditingCourse({
      ...editingCourse,
      modules: editingCourse.modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            sections: module.sections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  videos: section.videos.filter(
                    (_, index) => index !== videoIndex
                  ),
                };
              }
              return section;
            }),
          };
        }
        return module;
      }),
    });
  };

  // Move a module up or down
  const moveModule = (moduleId: string, direction: "up" | "down") => {
    if (!editingCourse) return;

    const moduleIndex = editingCourse.modules.findIndex(
      (module) => module.id === moduleId
    );
    if (moduleIndex === -1) return;

    const newModules = [...editingCourse.modules];

    if (direction === "up" && moduleIndex > 0) {
      // Swap orders
      const temp = newModules[moduleIndex].order;
      newModules[moduleIndex].order = newModules[moduleIndex - 1].order;
      newModules[moduleIndex - 1].order = temp;

      // Sort by order
      newModules.sort((a, b) => a.order - b.order);
    } else if (direction === "down" && moduleIndex < newModules.length - 1) {
      // Swap orders
      const temp = newModules[moduleIndex].order;
      newModules[moduleIndex].order = newModules[moduleIndex + 1].order;
      newModules[moduleIndex + 1].order = temp;

      // Sort by order
      newModules.sort((a, b) => a.order - b.order);
    }

    setEditingCourse({
      ...editingCourse,
      modules: newModules,
    });
  };

  // Move a section up or down within a module
  const moveSection = (
    moduleId: string,
    sectionId: string,
    direction: "up" | "down"
  ) => {
    if (!editingCourse) return;

    const moduleIndex = editingCourse.modules.findIndex(
      (module) => module.id === moduleId
    );
    if (moduleIndex === -1) return;

    const sectionIndex = editingCourse.modules[moduleIndex].sections.findIndex(
      (section) => section.id === sectionId
    );
    if (sectionIndex === -1) return;

    const newModules = [...editingCourse.modules];
    const newSections = [...newModules[moduleIndex].sections];

    if (direction === "up" && sectionIndex > 0) {
      // Swap orders
      const temp = newSections[sectionIndex].order;
      newSections[sectionIndex].order = newSections[sectionIndex - 1].order;
      newSections[sectionIndex - 1].order = temp;

      // Sort by order
      newSections.sort((a, b) => a.order - b.order);
    } else if (direction === "down" && sectionIndex < newSections.length - 1) {
      // Swap orders
      const temp = newSections[sectionIndex].order;
      newSections[sectionIndex].order = newSections[sectionIndex + 1].order;
      newSections[sectionIndex + 1].order = temp;

      // Sort by order
      newSections.sort((a, b) => a.order - b.order);
    }

    newModules[moduleIndex].sections = newSections;

    setEditingCourse({
      ...editingCourse,
      modules: newModules,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Courses List</CardTitle>
          <CardDescription>
            View all courses and their content structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search courses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={fetchCourses}>Refresh</Button>
          </div>

          {notification && (
            <Alert
              className={`mb-4 ${
                notification.type === "success" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <AlertDescription
                className={
                  notification.type === "success"
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {notification.message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4">
              <AlertDescription className="text-red-500">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-10">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-10">No courses found</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredCourses.map((course) => (
                <AccordionItem key={course.id} value={course.id}>
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
                    <div className="flex-1 text-left font-medium">
                      {course.mainTitle}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={(e) => openDeleteDialog(course, e)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        {course.description || "No description provided"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {course.modules
                        .sort((a, b) => a.order - b.order)
                        .map((module) => (
                          <Card
                            key={module.id}
                            className="border border-gray-200"
                          >
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">
                                Module: {module.moduleName}
                              </CardTitle>
                              <CardDescription>
                                {module.description ||
                                  "No description provided"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="space-y-3">
                                {module.sections
                                  .sort((a, b) => a.order - b.order)
                                  .map((section) => (
                                    <div
                                      key={section.id}
                                      className="border border-gray-100 rounded-md p-3"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium">
                                          {section.title}
                                        </h3>
                                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                                          <div className="flex items-center">
                                            <VidIcon className="h-3 w-3 mr-1" />
                                            <span>
                                              {countVideos(section)} videos
                                            </span>
                                          </div>
                                          <div className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            <span>
                                              {formatDuration(
                                                calculateSectionDuration(
                                                  section
                                                )
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-sm text-gray-600 mb-2">
                                        {section.description ||
                                          "No description provided"}
                                      </p>

                                      {section.videos &&
                                      section.videos.length > 0 ? (
                                        <div className="pl-3 border-l-2 border-gray-200 space-y-1 mt-2">
                                          {section.videos.map(
                                            (video, index) => (
                                              <div
                                                key={index}
                                                className="flex justify-between text-sm"
                                              >
                                                <span className="text-gray-700">
                                                  {index + 1}.{" "}
                                                  {video.name ? (
                                                    <span className="font-medium">
                                                      {video.name}
                                                    </span>
                                                  ) : (
                                                    video.id ||
                                                    "Video ID not set"
                                                  )}
                                                </span>
                                                <span className="text-gray-500">
                                                  {formatDuration(
                                                    video.duration || 0
                                                  )}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">
                                          No videos in this section
                                        </p>
                                      )}
                                    </div>
                                  ))}

                                {module.sections.length === 0 && (
                                  <p className="text-sm text-gray-500 italic py-2">
                                    This module has no sections.
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                      {course.modules.length === 0 && (
                        <p className="text-sm text-gray-500 italic py-2">
                          This course has no modules.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit Course Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Make changes to the course content and modules
            </DialogDescription>
          </DialogHeader>

          {notification && (
            <Alert
              className={
                notification.type === "success" ? "bg-green-50" : "bg-red-50"
              }
            >
              <AlertDescription
                className={
                  notification.type === "success"
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {notification.message}
              </AlertDescription>
            </Alert>
          )}

          {editingCourse && (
            <Tabs
              defaultValue="general"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Title</label>
                  <Input
                    value={editingCourse.mainTitle}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        mainTitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editingCourse.description || ""}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openDeleteDialog(editingCourse)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-6">
                {editingCourse.modules
                  .sort((a, b) => a.order - b.order)
                  .map((module, moduleIndex) => (
                    <Card key={module.id} className="border border-gray-200">
                      <CardHeader className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1 mr-4">
                            <label className="text-sm font-medium">
                              Module Name
                            </label>
                            <Input
                              value={module.moduleName}
                              onChange={(e) =>
                                updateModule(
                                  module.id,
                                  "moduleName",
                                  e.target.value
                                )
                              }
                            />

                            <label className="text-sm font-medium">
                              Module Description
                            </label>
                            <Textarea
                              value={module.description || ""}
                              onChange={(e) =>
                                updateModule(
                                  module.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              rows={2}
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={moduleIndex === 0}
                              onClick={() => moveModule(module.id, "up")}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                moduleIndex === editingCourse.modules.length - 1
                              }
                              onClick={() => moveModule(module.id, "down")}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <h4 className="font-medium text-sm mb-3">Sections</h4>
                        <div className="space-y-4">
                          {module.sections
                            .sort((a, b) => a.order - b.order)
                            .map((section, sectionIndex) => (
                              <div
                                key={section.id}
                                className="border border-gray-200 rounded-md p-3"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="space-y-2 flex-1 mr-4">
                                    <label className="text-sm font-medium">
                                      Section Title
                                    </label>
                                    <Input
                                      value={section.title}
                                      onChange={(e) =>
                                        updateSection(
                                          module.id,
                                          section.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                    />

                                    <label className="text-sm font-medium">
                                      Section Description
                                    </label>
                                    <Textarea
                                      value={section.description || ""}
                                      onChange={(e) =>
                                        updateSection(
                                          module.id,
                                          section.id,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      rows={2}
                                    />
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={sectionIndex === 0}
                                      onClick={() =>
                                        moveSection(module.id, section.id, "up")
                                      }
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        sectionIndex ===
                                        module.sections.length - 1
                                      }
                                      onClick={() =>
                                        moveSection(
                                          module.id,
                                          section.id,
                                          "down"
                                        )
                                      }
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-medium">
                                      Videos
                                    </h5>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        addVideo(module.id, section.id)
                                      }
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Video
                                    </Button>
                                  </div>

                                  {section.videos.map((video, videoIndex) => (
                                    <div
                                      key={videoIndex}
                                      className="space-y-2 border-l-2 border-gray-100 pl-2 py-2 mb-3"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div className="flex-1">
                                          <Input
                                            placeholder="Video Name"
                                            value={video.name || ""}
                                            onChange={(e) =>
                                              updateVideo(
                                                module.id,
                                                section.id,
                                                videoIndex,
                                                "name",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500"
                                          onClick={() =>
                                            removeVideo(
                                              module.id,
                                              section.id,
                                              videoIndex
                                            )
                                          }
                                          disabled={section.videos.length <= 1}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="flex-1">
                                          <Input
                                            placeholder="Video ID"
                                            value={video.id}
                                            onChange={(e) =>
                                              updateVideo(
                                                module.id,
                                                section.id,
                                                videoIndex,
                                                "id",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="w-32">
                                          <Input
                                            type="number"
                                            placeholder="Duration (sec)"
                                            min="0"
                                            value={video.duration}
                                            onChange={(e) =>
                                              updateVideo(
                                                module.id,
                                                section.id,
                                                videoIndex,
                                                "duration",
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {section.videos.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">
                                      No videos in this section
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCourseUpdates} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Course Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              <span className="font-medium">{courseToDelete?.mainTitle}</span>
              &quot;?
              <div className="mt-2 text-red-600">
                This action cannot be undone. All modules, sections, and videos
                in this course will be permanently removed.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                setCourseToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteCourse}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesList;
