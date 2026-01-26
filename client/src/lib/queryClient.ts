import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, url);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
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
