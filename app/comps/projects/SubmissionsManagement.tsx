import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";

interface SubmissionsManagementProps {
  projectId: string | null;
  onComplete: () => void;
}

interface Submission {
  id: string;
  userId: string;
  userEmail?: string;
  projectId: string;
  githubUrl: string;
  driveUrl: string;
  videoUrl?: string;
  comments?: string;
  submittedAt: string;
  status: "submitted" | "reviewed" | "returned" | "resubmitted";
  feedback?: string;
  resubmissionAllowed?: boolean;
  returnedAt?: string;
  resubmittedAt?: string;
  previousVersionId?: string;
  grade?: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
}

export default function SubmissionsManagement({
  projectId,
  onComplete,
}: SubmissionsManagementProps) {
  // State for managing submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string>(
    projectId || ""
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State for feedback dialog
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [requireResubmission, setRequireResubmission] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch projects to populate the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsRef);

        const fetchedProjects: Project[] = [];
        projectsSnapshot.forEach((doc) => {
          fetchedProjects.push({
            id: doc.id,
            ...doc.data(),
          } as Project);
        });

        setProjects(fetchedProjects);

        // Set initial project if none is selected
        if (!currentProjectId && fetchedProjects.length > 0) {
          setCurrentProjectId(fetchedProjects[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, [currentProjectId, projectId]);

  // Fetch submissions when project changes
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!currentProjectId) return;

      try {
        setLoading(true);

        const submissionsRef = collection(db, "submissions");
        const submissionQuery = query(
          submissionsRef,
          where("projectId", "==", currentProjectId)
        );

        const submissionSnapshot = await getDocs(submissionQuery);

        if (submissionSnapshot.empty) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        // Process submissions and fetch user emails
        const fetchedSubmissions: Submission[] = [];

        for (const submissionDoc of submissionSnapshot.docs) {
          const submissionData = submissionDoc.data() as Omit<Submission, "id">;

          // Fetch user email
          let userEmail = "Unknown";
          try {
            const userDoc = await getDoc(
              doc(db, "users", submissionData.userId)
            );
            if (userDoc.exists()) {
              userEmail = userDoc.data().email || "Unknown";
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }

          fetchedSubmissions.push({
            id: submissionDoc.id,
            ...submissionData,
            userEmail,
          });
        }

        // Sort by submission date (newest first)
        fetchedSubmissions.sort((a, b) => {
          return (
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
          );
        });

        setSubmissions(fetchedSubmissions);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [currentProjectId]);

  // Filter submissions based on search query
  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      submission.userEmail?.toLowerCase().includes(query) ||
      submission.status.toLowerCase().includes(query)
    );
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return "Invalid date";
    }
  };

  // Handle providing feedback
  const handleOpenFeedbackDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || "");
    setGrade(submission.grade?.toString() || "");
    setRequireResubmission(submission.resubmissionAllowed || false);
    setShowFeedbackDialog(true);
  };

  // Save feedback and status
  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;

    try {
      setIsSaving(true);

      const submissionRef = doc(db, "submissions", selectedSubmission.id);

      // Determine the new status
      const newStatus = requireResubmission ? "returned" : "reviewed";

      // Update the submission
      await updateDoc(submissionRef, {
        status: newStatus,
        feedback: feedback,
        grade: grade ? parseInt(grade) : null,
        resubmissionAllowed: requireResubmission,
        returnedAt: requireResubmission ? new Date().toISOString() : null,
      });

      // Update the submission in the local state
      setSubmissions(
        submissions.map((s) =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                status: newStatus,
                feedback: feedback,
                grade: grade ? parseInt(grade) : undefined,
                resubmissionAllowed: requireResubmission,
                returnedAt: requireResubmission
                  ? new Date().toISOString()
                  : undefined,
              }
            : s
        )
      );

      // Close the dialog
      setShowFeedbackDialog(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error updating submission:", err);
      alert("Failed to save feedback. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Status badge configuration
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      submitted: {
        color: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        label: "Submitted",
      },
      reviewed: {
        color: "bg-green-100 text-green-800 hover:bg-green-100",
        label: "Reviewed",
      },
      returned: {
        color: "bg-amber-100 text-amber-800 hover:bg-amber-100",
        label: "Returned for Resubmission",
      },
      resubmitted: {
        color: "bg-purple-100 text-purple-800 hover:bg-purple-100",
        label: "Resubmitted",
      },
    };

    const config = statusConfig[status] || statusConfig.submitted;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // If no project is selected, show projects dropdown
  if (!currentProjectId) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="project-select">
            Select a project to view submissions
          </Label>
          <Select value={currentProjectId} onValueChange={setCurrentProjectId}>
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="animate-spin mx-auto text-slate-400 mb-4"
          />
          <p className="text-slate-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Current project information
  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="space-y-6">
      {/* Project selection and search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-64">
          <Label htmlFor="project-select" className="mb-2 block">
            Project
          </Label>
          <Select value={currentProjectId} onValueChange={setCurrentProjectId}>
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 sm:max-w-sm">
          <Label htmlFor="search" className="mb-2 block">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              id="search"
              placeholder="Search by student email or status..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Current project info */}
      {currentProject && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">{currentProject.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {currentProject.description}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Submissions table */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-md">
          <FileText size={32} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-1">
            No submissions found
          </h3>
          <p className="text-slate-600">
            {searchQuery
              ? "No submissions match your search criteria"
              : "This project doesn't have any submissions yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.userEmail}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                  <TableCell>
                    {submission.grade !== undefined
                      ? `${submission.grade}%`
                      : "Not graded"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenFeedbackDialog(submission)}
                    >
                      <span className="sr-only">Review</span>
                      <ChevronRight size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={onComplete}>
          Back to Projects
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Provide feedback and grade for the student submission.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Student info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-slate-900">
                    {selectedSubmission.userEmail}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Submitted: {formatDate(selectedSubmission.submittedAt)}
                  </p>
                </div>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              {/* Submission links */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">GitHub Repository:</span>
                  <a
                    href={selectedSubmission.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    style={{ color: "#004aad" }}
                  >
                    View <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Google Drive:</span>
                  <a
                    href={selectedSubmission.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    style={{ color: "#004aad" }}
                  >
                    View <ExternalLink size={14} className="ml-1" />
                  </a>
                </div>

                {selectedSubmission.videoUrl && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Video:</span>
                    <a
                      href={selectedSubmission.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                      style={{ color: "#004aad" }}
                    >
                      View <ExternalLink size={14} className="ml-1" />
                    </a>
                  </div>
                )}
              </div>

              {/* Student comments */}
              {selectedSubmission.comments && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">
                    Student Comments:
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
                    {selectedSubmission.comments}
                  </div>
                </div>
              )}

              {/* Feedback form */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Provide feedback for the student..."
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade">Grade (0-100)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 85"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="resubmission"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={requireResubmission}
                        onChange={(e) =>
                          setRequireResubmission(e.target.checked)
                        }
                      />
                      <Label htmlFor="resubmission" className="font-normal">
                        Require resubmission
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFeedback}
              style={{ backgroundColor: "#004aad" }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
