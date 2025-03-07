import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Utility function to throw an error if the response is not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If the response is not JSON, use the status text
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

// Generic API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: object,
  options?: RequestInit
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options,
  });

  await throwIfResNotOk(res);
  return res;
}

// Enhanced API request function with JSON parsing
export async function apiRequestJson<T>(
  method: string,
  url: string,
  data?: object,
  options?: RequestInit
): Promise<T> {
  const res = await apiRequest(method, url, data, options);
  return res.json() as Promise<T>;
}

// Query function factory
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [url, method = "GET", body] = queryKey as [string, string?, object?];

    const res = await fetch(url, {
      method,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true, // Refetch data when the window regains focus
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Retry only on network errors, not on 4xx or 5xx errors
        if (error instanceof Error && error.message.includes("Network Error")) {
          return failureCount < 3; // Retry up to 3 times
        }
        return false;
      },
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});