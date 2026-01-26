import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  // Add timeout to prevent infinite loading
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // If it's an abort error (timeout), return null to allow unauthenticated access
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Auth request timed out, treating as unauthenticated");
      return null;
    }
    throw error;
  }
}

async function logout(): Promise<void> {
  // Call logout endpoint to clear session
  await fetch("/api/auth/logout", {
    method: "GET",
    credentials: "include",
  });
  // Redirect to landing page
  window.location.href = "/";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes - session persists via cookie
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  // If there's an error and we've been loading for more than 5 seconds, stop loading
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  useEffect(() => {
    if (isLoading && !error) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHasTimedOut(false);
    }
  }, [isLoading, error]);

  return {
    user: error && hasTimedOut ? null : user,
    isLoading: isLoading && !hasTimedOut,
    isAuthenticated: !!user && !error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
