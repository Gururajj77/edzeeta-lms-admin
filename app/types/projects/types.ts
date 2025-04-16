/**
 * Project type definitions with simplified structure
 */

/**
 * ProjectCategory represents a main project category that contains multiple projects
 */
export interface ProjectCategory {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
}

/**
 * Project type representing an individual project in the LMS
 */
export interface Project {
  id: string;
  categoryId: string; // Reference to parent category
  title: string;
  description: string;
  objectives: string[];
  learningOutcomes: string[];
  deliverables: string[];
  toolsAndTechnologies: string[];
  projectBriefUrl: string;
  submissionProcess: string;
  supportInfo: string;
  videoGuidelines: string;
}

/**
 * ProjectCategoryWithProjects includes the category and its child projects
 */
export interface ProjectCategoryWithProjects extends ProjectCategory {
  projects: Project[];
}

/**
 * UserProject represents the assignment of a project to a user
 */
export interface UserProject {
  id: string;
  userId: string;
  projectId: string;
}
