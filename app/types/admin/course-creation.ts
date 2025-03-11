// Updated interfaces to support multiple videos with duration

export interface Video {
  id: string;
  duration: number;
}

export interface VideoSection {
  id: string;
  title: string;
  videoId?: string; // Kept for backward compatibility
  videos: Video[]; // New array of videos with duration
  duration?: number; // Add this for backward compatibility
  description?: string;
  order: number;
}

export interface CourseModule {
  id: string;
  moduleName: string;
  description?: string;
  order: number;
  sections: VideoSection[];
}

export interface NewCourse {
  mainTitle: string;
  description?: string;
  modules: CourseModule[];
}

// Updated error interfaces for form validation

export interface VideoError {
  id?: string;
  duration?: string;
}

export interface SectionError {
  title?: string;
  videoId?: string; // Kept for backward compatibility
  videos?: {
    [index: number]: VideoError;
  };
}

export interface ModuleError {
  moduleName?: string;
  sections?: {
    [key: string]: SectionError;
  };
}

export interface FormErrors {
  mainTitle?: string;
  modules?: {
    [key: string]: ModuleError;
  };
}
