
export async function apiRequest(method: string, path: string, body?: unknown) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Failed to process request",
      }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error instanceof Error ? error : new Error("Network error occurred");
  }
}

export default apiRequest;
