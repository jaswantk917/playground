// src/lib/stores/taskStore.ts
import { writable, get } from "svelte/store";
import { api } from "../api/client"; // Re-using the generic client from before
import type { Task } from "../api/types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

function createTaskStore() {
  const { subscribe, update } = writable<TaskState>({
    tasks: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    // 1. GET: Load all tasks
    loadTasks: async () => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.get<Task[]>("/tasks");
        update((s) => ({ ...s, tasks: data, loading: false }));
      } catch (err) {
        update((s) => ({
          ...s,
          loading: false,
          error: (err as Error).message,
        }));
      }
    },

    // 2. POST: Add a task
    addTask: async (title: string) => {
      // Optimistic update (optional, but good for UX) could go here
      try {
        const newTask = await api.post<Task>("/tasks", { title });
        update((s) => ({ ...s, tasks: [newTask, ...s.tasks] }));
      } catch (err) {
        console.error("Failed to add task", err);
        // Handle rollback or error notification here
      }
    },

    // 3. PATCH: Toggle completion status
    toggleTask: async (id: string, currentStatus: boolean) => {
      // Optimistic Update: Flip it immediately in UI
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, isCompleted: !currentStatus } : t,
        ),
      }));

      try {
        await api.patch(`/tasks/${id}`, { isCompleted: !currentStatus });
      } catch (err) {
        console.error("Failed to update task", err);
        // Rollback if server fails
        update((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, isCompleted: currentStatus } : t,
          ),
        }));
      }
    },

    // 4. DELETE: Remove a task
    deleteTask: async (id: string) => {
      // Optimistic Remove
      const previousTasks = get(taskStore).tasks; // Requires importing 'get' from svelte/store
      update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

      try {
        await api.delete(`/tasks/${id}`);
      } catch (err) {
        console.error("Failed to delete task", err);
        // Rollback
        update((s) => ({ ...s, tasks: previousTasks }));
      }
    },
  };
}

export const taskStore = createTaskStore();
