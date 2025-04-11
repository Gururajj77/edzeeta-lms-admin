import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@radix-ui/react-select";
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
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  BookOpen,
  Info,
  Save,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import {
  Course,
  CourseModule,
  VideoSection,
  Video,
} from "../../types/admin/course-creation";
import {
  updateCourse,
  deleteCourse,
  uploadThumbnail,
} from "@/app/actions/courseActions";

const CoursesList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState<boolean>(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const saveCourseUpdates = async () => {
    if (!editingCourse || saving) return;

    setSaving(true);
    try {
      // Use the server action directly with the thumbnail file
      const result = await updateCourse(
        editingCourse.id,
        editingCourse,
        thumbnailFile || undefined
      );

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

        // Clear the thumbnail file after successful update
        setThumbnailFile(null);
        setThumbnailPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Close modal after a short delay
        setTimeout(() => {
          setIsModalOpen(false);
          setNotification(null);
        }, 1500);
      } else {
        // Error handling code remains the same
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error handling code remains the same
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
    const courseDeepCopy = JSON.parse(JSON.stringify(course)); // Create a deep copy
    setEditingCourse(courseDeepCopy);
    setThumbnailPreview(courseDeepCopy.thumbnail || null);
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
  // Calculate total videos and duration in a module
  const calculateModuleTotals = (module: CourseModule) => {
    let totalVideos = 0;
    let totalDuration = 0;

    module.sections.forEach((section) => {
      totalVideos += countVideos(section);
      totalDuration += calculateSectionDuration(section);
    });

    return { totalVideos, totalDuration };
  };

  // Add a new module to the course
  const addModule = () => {
    if (!editingCourse) return;

    // Find the highest order to place new module at the end
    const highestOrder = editingCourse.modules.reduce(
      (max, module) => (module.order > max ? module.order : max),
      0
    );

    const newModule = {
      id: `module-${Date.now()}`, // Generate a temporary ID
      moduleName: "New Module",
      description: "",
      order: highestOrder + 1,
      sections: [], // Start with no sections
    };

    setEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule],
    });
  };

  // Add a new section to a module
  const addSection = (moduleId: string) => {
    if (!editingCourse) return;

    const moduleIndex = editingCourse.modules.findIndex(
      (module) => module.id === moduleId
    );
    if (moduleIndex === -1) return;

    // Find the highest order for this module's sections
    const highestOrder = editingCourse.modules[moduleIndex].sections.reduce(
      (max, section) => (section.order > max ? section.order : max),
      0
    );

    const newSection = {
      id: `section-${Date.now()}`, // Generate a temporary ID
      title: "New Section",
      description: "",
      order: highestOrder + 1,
      videos: [{ id: "", name: "", duration: 0 }], // Start with one empty video
    };

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      sections: [...updatedModules[moduleIndex].sections, newSection],
    };

    setEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setThumbnailFile(file);
  };

  // Upload thumbnail
  const handleThumbnailUpload = async () => {
    if (!thumbnailFile || !editingCourse) return;

    setUploadingThumbnail(true);
    try {
      const result = await uploadThumbnail(editingCourse.id, thumbnailFile);

      if (result.success && result.url) {
        // Update the editing course with the new thumbnail URL
        setEditingCourse({
          ...editingCourse,
          thumbnail: result.url,
        });

        setNotification({
          type: "success",
          message: "Thumbnail uploaded successfully!",
        });

        // Clear the file input
        setThumbnailFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to upload thumbnail",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "Error uploading thumbnail",
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };
  // Main component return JSX
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Courses Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Manage and organize your course content structure
              </CardDescription>
            </div>
            <Button
              onClick={fetchCourses}
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by title or description..."
                className="pl-10 py-5 border-gray-300 focus:border-blue-400 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {notification && (
            <Alert
              className={`mb-6 ${
                notification.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              } flex items-center`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <AlertDescription
                className={
                  notification.type === "success"
                    ? "text-green-700 font-medium"
                    : "text-red-700 font-medium"
                }
              >
                {notification.message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <AlertDescription className="text-red-700 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="h-10 w-10 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No courses found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {filteredCourses.map((course) => (
                <AccordionItem
                  key={course.id}
                  value={course.id}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow"
                >
                  <AccordionTrigger className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 text-left font-medium text-gray-800 flex items-center gap-3">
                      {course.thumbnail ? (
                        <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={course.thumbnail}
                            alt=""
                            width={150}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      )}
                      {course.mainTitle}
                      <Badge
                        variant="outline"
                        className="ml-3 text-xs font-normal bg-blue-50 text-blue-600 border-blue-200"
                      >
                        {course.modules.length}{" "}
                        {course.modules.length === 1 ? "module" : "modules"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course);
                        }}
                        className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                        onClick={(e) => openDeleteDialog(course, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-2 pb-6 bg-white">
                    <div className="space-y-4 mb-6">
                      {course.thumbnail && (
                        <div className="mb-4">
                          <div className="w-32 h-24 overflow-hidden rounded-md border border-gray-200">
                            <Image
                              width={150}
                              height={100}
                              src={course.thumbnail}
                              alt={`${course.mainTitle} thumbnail`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-gray-600 italic border-l-4 border-gray-200 pl-3 py-1">
                        {course.description || "No description provided"}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {course.modules
                        .sort((a, b) => a.order - b.order)
                        .map((module) => {
                          const { totalVideos, totalDuration } =
                            calculateModuleTotals(module);

                          return (
                            <Card
                              key={module.id}
                              className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="py-4 bg-gray-50">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                      <Layers className="h-4 w-4 text-indigo-500" />
                                      {module.moduleName}
                                    </CardTitle>
                                    <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                                      <div className="flex items-center">
                                        <VidIcon className="h-3 w-3 mr-1 text-indigo-400" />
                                        <span>{totalVideos} videos</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1 text-indigo-400" />
                                        <span>
                                          {formatDuration(totalDuration)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <CardDescription className="mt-2 text-gray-600">
                                  {module.description ||
                                    "No description provided"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="py-4">
                                <div className="space-y-4">
                                  {module.sections
                                    .sort((a, b) => a.order - b.order)
                                    .map((section) => (
                                      <div
                                        key={section.id}
                                        className="border border-gray-200 rounded-md p-4 hover:border-indigo-200 transition-colors"
                                      >
                                        <div className="flex justify-between items-center mb-3">
                                          <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-indigo-500" />
                                            {section.title}
                                          </h3>
                                          <div className="flex items-center text-xs text-gray-500 space-x-3">
                                            <div className="flex items-center">
                                              <VidIcon className="h-3 w-3 mr-1 text-indigo-400" />
                                              <span>
                                                {countVideos(section)} videos
                                              </span>
                                            </div>
                                            <div className="flex items-center">
                                              <Clock className="h-3 w-3 mr-1 text-indigo-400" />
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

                                        <p className="text-sm text-gray-600 mb-3">
                                          {section.description ||
                                            "No description provided"}
                                        </p>

                                        {section.videos &&
                                        section.videos.length > 0 ? (
                                          <div className="pl-4 border-l-2 border-indigo-100 space-y-2 mt-4">
                                            {section.videos.map(
                                              (video, index) => (
                                                <div
                                                  key={index}
                                                  className="flex justify-between text-sm p-2 rounded-md hover:bg-gray-50"
                                                >
                                                  <span className="text-gray-700 flex items-center">
                                                    <VidIcon className="h-3 w-3 mr-2 text-indigo-400" />
                                                    <span className="font-medium text-gray-700">
                                                      {video.name ||
                                                        video.id ||
                                                        "Video ID not set"}
                                                    </span>
                                                  </span>
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                                                  >
                                                    {formatDuration(
                                                      video.duration || 0
                                                    )}
                                                  </Badge>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md flex items-center mt-3">
                                            <AlertTriangle className="h-3 w-3 mr-2 text-amber-400" />
                                            No videos in this section
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                  {module.sections.length === 0 && (
                                    <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md flex items-center justify-center">
                                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                                      This module has no sections.
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}

                      {course.modules.length === 0 && (
                        <div className="text-sm text-gray-500 italic bg-gray-50 p-6 rounded-md flex flex-col items-center justify-center">
                          <AlertTriangle className="h-6 w-6 mb-2 text-amber-400" />
                          <p>This course has no modules.</p>
                        </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 bg-gradient-to-r from-gray-50 to-white border-b">
            <DialogTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Edit Course
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Make changes to the course content and structure
            </DialogDescription>
          </DialogHeader>

          {notification && (
            <Alert
              className={`mx-6 mt-4 ${
                notification.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              } flex items-center`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <AlertDescription
                className={
                  notification.type === "success"
                    ? "text-green-700 font-medium"
                    : "text-red-700 font-medium"
                }
              >
                {notification.message}
              </AlertDescription>
            </Alert>
          )}

          {editingCourse && (
            <div className="p-6">
              <Tabs
                defaultValue="general"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="general"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-md px-4 py-2 flex items-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="modules"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-md px-4 py-2 flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Modules
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-2">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Course Title
                    </label>
                    <Input
                      value={editingCourse.mainTitle}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          mainTitle: e.target.value,
                        })
                      }
                      className="border-gray-300 focus:border-blue-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Course Thumbnail
                    </label>
                    <div className="flex flex-col space-y-4">
                      {thumbnailPreview && (
                        <div className="w-48 h-32 relative overflow-hidden rounded-md border border-gray-200">
                          <Image
                            width={150}
                            height={100}
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 border-red-200 hover:bg-red-50 p-1 h-auto"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setThumbnailFile(null);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";

                              // Clear the thumbnail URL if it exists
                              if (editingCourse?.thumbnail) {
                                setEditingCourse({
                                  ...editingCourse,
                                  thumbnail: undefined,
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleThumbnailChange}
                            id="thumbnail-upload"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="h-4 w-4" />
                            {thumbnailPreview ? "Change Image" : "Select Image"}
                          </Button>
                        </div>

                        {thumbnailFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            onClick={handleThumbnailUpload}
                            disabled={uploadingThumbnail || !thumbnailFile}
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingThumbnail ? "Uploading..." : "Upload Now"}
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        Recommended image size: 1280×720 pixels (16:9 ratio).
                        Max size: 2MB. Supported formats: JPEG, PNG, WEBP, GIF
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Textarea
                      value={editingCourse.description || ""}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          description: e.target.value,
                        })
                      }
                      rows={5}
                      className="border-gray-300 focus:border-blue-400 transition-colors resize-none"
                      placeholder="Add a detailed description of this course..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      className="text-red-600 border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2"
                      onClick={() => openDeleteDialog(editingCourse)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Course
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="space-y-8 mt-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-800">
                      Course Modules
                    </h3>
                    <Button
                      variant="outline"
                      onClick={addModule}
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Module
                    </Button>
                  </div>

                  {editingCourse.modules.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">
                        No modules in this course
                      </p>
                      <p className="text-gray-500 text-sm mt-2 mb-4">
                        Add a module to organize your course content
                      </p>
                      <Button
                        variant="outline"
                        onClick={addModule}
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Module
                      </Button>
                    </div>
                  ) : (
                    editingCourse.modules
                      .sort((a, b) => a.order - b.order)
                      .map((module, moduleIndex) => (
                        <Card
                          key={module.id}
                          className="border border-gray-200 shadow-sm"
                        >
                          <CardHeader className="py-4 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1 mr-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                                    className="border-gray-300 focus:border-blue-400 transition-colors"
                                    placeholder="Enter module name..."
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                                    className="border-gray-300 focus:border-blue-400 transition-colors resize-none"
                                    placeholder="Add a brief description of this module..."
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={moduleIndex === 0}
                                  onClick={() => moveModule(module.id, "up")}
                                  className="flex items-center gap-1 hover:bg-gray-50 transition-colors"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                  <span className="sr-only">Move up</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    moduleIndex ===
                                    editingCourse.modules.length - 1
                                  }
                                  onClick={() => moveModule(module.id, "down")}
                                  className="flex items-center gap-1 hover:bg-gray-50 transition-colors"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                  <span className="sr-only">Move down</span>
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Sections
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addSection(module.id)}
                                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Section
                              </Button>
                            </div>
                            {module.sections.length === 0 ? (
                              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 font-medium">
                                  No sections in this module
                                </p>
                                <p className="text-gray-500 text-sm mt-1 mb-3">
                                  Add a section to organize your videos
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSection(module.id)}
                                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add First Section
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {module.sections
                                  .sort((a, b) => a.order - b.order)
                                  .map((section, sectionIndex) => (
                                    <div
                                      key={section.id}
                                      className="border border-gray-200 rounded-md p-4 shadow-sm"
                                    >
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-3 flex-1 mr-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                                              className="border-gray-300 focus:border-blue-400 transition-colors"
                                              placeholder="Enter section title..."
                                            />
                                          </div>

                                          <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                                              className="border-gray-300 focus:border-blue-400 transition-colors resize-none"
                                              placeholder="Add a description for this section..."
                                            />
                                          </div>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={sectionIndex === 0}
                                            onClick={() =>
                                              moveSection(
                                                module.id,
                                                section.id,
                                                "up"
                                              )
                                            }
                                            className="flex items-center gap-1 hover:bg-gray-50 transition-colors"
                                          >
                                            <ArrowUp className="h-4 w-4" />
                                            <span className="sr-only">
                                              Move up
                                            </span>
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
                                            className="flex items-center gap-1 hover:bg-gray-50 transition-colors"
                                          >
                                            <ArrowDown className="h-4 w-4" />
                                            <span className="sr-only">
                                              Move down
                                            </span>
                                          </Button>
                                        </div>
                                      </div>

                                      <Separator className="my-4" />

                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <VidIcon className="h-4 w-4 text-blue-500" />
                                            Videos
                                          </h5>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              addVideo(module.id, section.id)
                                            }
                                            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                                          >
                                            <Plus className="h-3 w-3" />
                                            Add Video
                                          </Button>
                                        </div>

                                        {section.videos.map(
                                          (video, videoIndex) => (
                                            <div
                                              key={videoIndex}
                                              className="space-y-3 border-l-2 border-blue-100 pl-3 py-3 bg-gray-50 rounded-md"
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
                                                    className="border-gray-300 focus:border-blue-400 transition-colors"
                                                  />
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                  onClick={() =>
                                                    removeVideo(
                                                      module.id,
                                                      section.id,
                                                      videoIndex
                                                    )
                                                  }
                                                  disabled={
                                                    section.videos.length <= 1
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                  <span className="sr-only">
                                                    Remove
                                                  </span>
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
                                                    className="border-gray-300 focus:border-blue-400 transition-colors"
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
                                                        parseInt(
                                                          e.target.value
                                                        ) || 0
                                                      )
                                                    }
                                                    className="border-gray-300 focus:border-blue-400 transition-colors"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}

                                        {section.videos.length === 0 && (
                                          <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-md flex items-center justify-center">
                                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                                            No videos in this section
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={saveCourseUpdates}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
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
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to delete &quot;
                <span className="font-medium">{courseToDelete?.mainTitle}</span>
                &quot;?
              </p>
              <div className="bg-red-50 p-3 rounded-md text-red-600 border border-red-200 flex items-start mt-2">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  This action cannot be undone. All modules, sections, and
                  videos in this course will be permanently removed.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                setCourseToDelete(null);
              }}
              className="hover:bg-gray-100 transition-colors"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              onClick={handleDeleteCourse}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesList;
