// src/lib/api/types.ts

export interface Task {
  id: string; // UUID or database ID
  title: string; // The task description
  isCompleted: boolean;
  createdAt: string; // ISO Date string
}

// Standardized API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
