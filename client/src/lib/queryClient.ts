import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API base URL from environment variable or use relative path
const getApiBaseUrl = () => {
  // In production build, Vite replaces import.meta.env.VITE_API_URL at build time
  // For development, it uses the Vite proxy
  // If VITE_API_URL is not set, use relative paths (works with same-origin or proxy)
  const apiUrl = import.meta.env.VITE_API_URL || "";
  
  // Log API URL configuration in development
  if (import.meta.env.DEV) {
    console.log("API Base URL configured:", apiUrl || "(using relative paths - requires backend on same domain or proxy)");
  }
  
  return apiUrl;
};

/** True if requests will hit a real API (backend URL set, or dev proxy). Used to show "set VITE_API_URL" warning. */
export const isApiUrlConfigured = (): boolean => {
  if (import.meta.env.DEV) return true; // dev uses proxy
  return !!(import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim());
};

export const getApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${normalizedPath}`;
  
  // Log in development for debugging
  if (import.meta.env.DEV) {
    console.log(`API Request: ${fullUrl}`);
  }
  
  return fullUrl;
};

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMessage = url 
      ? `[${res.status}] ${res.statusText} - Route: ${url}\nDetails: ${text}`
      : `${res.status}: ${text}`;
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    (error as any).url = url || res.url;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiUrl(url);
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, apiUrl);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const url = getApiUrl(path);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      onError: (error: any) => {
        // Log route errors to console for debugging
        if (error?.url) {
          console.error(`[Query Error] Route: ${error.url}`, error);
        } else {
          console.error("[Query Error]", error);
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Log mutation errors to console for debugging
        if (error?.url) {
          console.error(`[Mutation Error] Route: ${error.url}`, error);
        } else {
          console.error("[Mutation Error]", error);
        }
      },
    },
  },
});
