import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import { ProjectCategory, Project } from "@/app/types/projects/types";

interface ProjectFormProps {
  projectId: string | null; // null means creating new
  onComplete: () => void;
}

export default function ProjectForm({
  projectId,
  onComplete,
}: ProjectFormProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([""]);
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [toolsAndTechnologies, setToolsAndTechnologies] = useState<string[]>([
    "",
  ]);
  const [projectBriefUrl, setProjectBriefUrl] = useState("");
  const [submissionProcess, setSubmissionProcess] = useState("");
  const [supportInfo, setSupportInfo] = useState("");
  const [videoGuidelines, setVideoGuidelines] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [fetchingProject, setFetchingProject] = useState(false);

  // Fetch categories for the dropdown
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

        // If we have categories and no category is selected, select the first one
        if (fetchedCategories.length > 0 && !categoryId) {
          setCategoryId(fetchedCategories[0].id);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Fetch project data if editing an existing project
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        setFetchingProject(true);
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data() as Omit<Project, "id">;
          setTitle(projectData.title);
          setDescription(projectData.description);
          setCategoryId(projectData.categoryId);
          setObjectives(projectData.objectives);
          setLearningOutcomes(projectData.learningOutcomes);
          setDeliverables(projectData.deliverables);
          setToolsAndTechnologies(projectData.toolsAndTechnologies);
          setProjectBriefUrl(projectData.projectBriefUrl);
          setSubmissionProcess(projectData.submissionProcess);
          setSupportInfo(projectData.supportInfo);
          setVideoGuidelines(projectData.videoGuidelines);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setFetchingProject(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Handle array field updates (objectives, deliverables, etc.)
  const updateArrayField = (
    index: number,
    value: string,
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setArray(newArray);
  };

  const addArrayItem = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setArray([...array, ""]);
  };

  const removeArrayItem = (
    index: number,
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newArray = [...array];
    newArray.splice(index, 1);
    setArray(newArray);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!categoryId) {
      alert("Please select a category");
      return;
    }

    // Validate fields - basic validation
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Filter out empty items from arrays
    const filteredObjectives = objectives.filter((item) => item.trim() !== "");
    const filteredOutcomes = learningOutcomes.filter(
      (item) => item.trim() !== ""
    );
    const filteredDeliverables = deliverables.filter(
      (item) => item.trim() !== ""
    );
    const filteredTools = toolsAndTechnologies.filter(
      (item) => item.trim() !== ""
    );

    // Check that arrays have at least one item
    if (
      filteredObjectives.length === 0 ||
      filteredOutcomes.length === 0 ||
      filteredDeliverables.length === 0 ||
      filteredTools.length === 0
    ) {
      alert("Please add at least one item to each list");
      return;
    }

    try {
      setLoading(true);

      const projectData = {
        title,
        description,
        categoryId,
        objectives: filteredObjectives,
        learningOutcomes: filteredOutcomes,
        deliverables: filteredDeliverables,
        toolsAndTechnologies: filteredTools,
        projectBriefUrl,
        submissionProcess,
        supportInfo,
        videoGuidelines,
      };

      if (projectId) {
        // Update existing project
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, projectData);
      } else {
        // Create new project
        await addDoc(collection(db, "projects"), projectData);
      }

      onComplete();
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Failed to save project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProject) {
    return <div className="text-center py-4">Loading project data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 && (
            <p className="text-sm text-amber-600">
              No categories available. Please create a category first.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the project"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Objectives */}
      <div className="grid gap-2">
        <Label>Objectives *</Label>
        <div className="space-y-2">
          {objectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={objective}
                onChange={(e) =>
                  updateArrayField(
                    index,
                    e.target.value,
                    objectives,
                    setObjectives
                  )
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() =>
                  removeArrayItem(index, objectives, setObjectives)
                }
                disabled={objectives.length <= 1}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2 flex items-center justify-center gap-1"
            onClick={() => addArrayItem(objectives, setObjectives)}
          >
            <Plus size={16} />
            <span>Add Objective</span>
          </Button>
        </div>
      </div>

      {/* Learning Outcomes */}
      <div className="grid gap-2">
        <Label>Learning Outcomes *</Label>
        <div className="space-y-2">
          {learningOutcomes.map((outcome, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={outcome}
                onChange={(e) =>
                  updateArrayField(
                    index,
                    e.target.value,
                    learningOutcomes,
                    setLearningOutcomes
                  )
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() =>
                  removeArrayItem(index, learningOutcomes, setLearningOutcomes)
                }
                disabled={learningOutcomes.length <= 1}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2 flex items-center justify-center gap-1"
            onClick={() => addArrayItem(learningOutcomes, setLearningOutcomes)}
          >
            <Plus size={16} />
            <span>Add Learning Outcome</span>
          </Button>
        </div>
      </div>

      {/* Deliverables */}
      <div className="grid gap-2">
        <Label>Deliverables *</Label>
        <div className="space-y-2">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={deliverable}
                onChange={(e) =>
                  updateArrayField(
                    index,
                    e.target.value,
                    deliverables,
                    setDeliverables
                  )
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() =>
                  removeArrayItem(index, deliverables, setDeliverables)
                }
                disabled={deliverables.length <= 1}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2 flex items-center justify-center gap-1"
            onClick={() => addArrayItem(deliverables, setDeliverables)}
          >
            <Plus size={16} />
            <span>Add Deliverable</span>
          </Button>
        </div>
      </div>

      {/* Tools and Technologies */}
      <div className="grid gap-2">
        <Label>Tools & Technologies *</Label>
        <div className="space-y-2">
          {toolsAndTechnologies.map((tool, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={tool}
                onChange={(e) =>
                  updateArrayField(
                    index,
                    e.target.value,
                    toolsAndTechnologies,
                    setToolsAndTechnologies
                  )
                }
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                onClick={() =>
                  removeArrayItem(
                    index,
                    toolsAndTechnologies,
                    setToolsAndTechnologies
                  )
                }
                disabled={toolsAndTechnologies.length <= 1}
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2 flex items-center justify-center gap-1"
            onClick={() =>
              addArrayItem(toolsAndTechnologies, setToolsAndTechnologies)
            }
          >
            <Plus size={16} />
            <span>Add Tool/Technology</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="submissionProcess">Submission Process *</Label>
        <Textarea
          id="submissionProcess"
          placeholder="Describe how students should submit their work"
          rows={3}
          value={submissionProcess}
          onChange={(e) => setSubmissionProcess(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="supportInfo">Support Information *</Label>
        <Textarea
          id="supportInfo"
          placeholder="Add information about available support resources"
          rows={3}
          value={supportInfo}
          onChange={(e) => setSupportInfo(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="projectBriefUrl">Project Brief URL *</Label>
        <Input
          id="projectBriefUrl"
          placeholder="URL to the project brief document"
          value={projectBriefUrl}
          onChange={(e) => setProjectBriefUrl(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="videoGuidelines">Video Guidelines *</Label>
        <Textarea
          id="videoGuidelines"
          placeholder="Guidelines for video submissions"
          rows={2}
          value={videoGuidelines}
          onChange={(e) => setVideoGuidelines(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onComplete} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          style={{ backgroundColor: "#004aad" }}
          disabled={loading || categories.length === 0}
        >
          {loading
            ? "Saving..."
            : projectId
            ? "Save Changes"
            : "Create Project"}
        </Button>
      </div>
    </div>
  );
}
