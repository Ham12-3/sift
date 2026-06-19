export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  language?: string;
  size?: number;
  children?: TreeNode[];
};

export interface FileContent {
  path: string;
  language: string;
  size: number;
  content: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ReviewTemplate = 'security' | 'performance' | 'quality';

export interface ReviewIssue {
  title: string;
  description: string;
  severity: Severity;
  file: string;
  line: number | null;
  recommendation: string;
}

export interface Review {
  id: string;
  project: string;
  template: ReviewTemplate;
  scope: 'file' | 'files' | 'project';
  targetPaths: string[];
  status: 'pending' | 'completed' | 'failed';
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  topSeverity: Severity | 'none';
  severityCounts: Record<Severity, number>;
  model: string;
  error: string;
  createdAt: string;
}

export interface ReviewTemplateMeta {
  key: ReviewTemplate;
  label: string;
  description: string;
  focus: string[];
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKeyHint: string;
  isDefault: boolean;
}

export interface EnvDefaultInfo {
  configured: boolean;
  name?: string;
  baseUrl?: string;
  model?: string;
}

export interface ChatSession {
  id: string;
  project: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedFiles: string[];
  createdAt: string;
}

export interface GithubRepo {
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
}

export interface GithubReposResponse {
  connected: boolean;
  repos: GithubRepo[];
}
