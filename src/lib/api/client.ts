// src/lib/api/client.ts
import { PUBLIC_API_URL } from "$env/static/public";

// Define all allowed HTTP methods
type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || "http://localhost:3001";
  }

  /**
   * Internal generic fetch wrapper
   */
  private async request<T>(
    endpoint: string,
    method: RequestMethod,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP Error ${response.status}`);
      }

      // Some endpoints (like DELETE) might return empty bodies
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API ${method} ${endpoint} failed:`, error);
      throw error;
    }
  }

  // --- Public Methods ---

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, "GET");
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, "POST", body);
  }

  // This was missing!
  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, "PATCH", body);
  }

  // This was also missing!
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, "DELETE");
  }
}

export const api = new ApiClient(
  PUBLIC_API_URL || "https://apis.bionaraq.info",
);
