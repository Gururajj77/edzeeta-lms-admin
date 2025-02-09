export interface VideoSection {
  id: string;
  title: string;
  videoId: string;
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

export interface FormErrors {
  mainTitle?: string;
  modules?: {
    [key: string]: {
      moduleName?: string;
      sections?: {
        [key: string]: {
          title?: string;
          videoId?: string;
        };
      };
    };
  };
}

interface SectionError {
  title?: string;
  videoId?: string;
}

interface ModuleError {
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
