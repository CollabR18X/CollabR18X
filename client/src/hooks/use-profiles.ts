import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useMyProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Partial<InsertProfile>) => {
      try {
        // Try to validate, but be lenient - allow extra fields
        let validated = data;
        try {
          validated = api.profiles.update.input.parse(data);
        } catch (validationError: any) {
          // If validation fails, log but still send the data (backend will handle validation)
          console.warn("Validation warning:", validationError);
          // Continue with original data - backend Pydantic model is more lenient
        }
        
        const res = await fetch(api.profiles.update.path, {
          method: api.profiles.update.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
          credentials: "include",
        });
        
        if (!res.ok) {
          let errorMessage = "Failed to update profile";
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        // Try to parse response, but be lenient
        try {
          return api.profiles.update.responses[200].parse(await res.json());
        } catch {
          // If response parsing fails, just return the raw JSON
          return await res.json();
        }
      } catch (error: any) {
        // Re-throw validation errors or network errors
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to update profile");
      }
    },
    onSuccess: () => {
      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path] });
      // Don't show toast here - let the calling component handle success messages
    },
    onError: (error) => {
      // Don't show toast here - let the calling component handle error messages
      // The component will show more specific error messages
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: [api.profiles.list.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return api.profiles.list.responses[200].parse(await res.json());
    },
  });
}

export function useProfile(id: number) {
  return useQuery({
    queryKey: [api.profiles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.profiles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useLikeProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ likedId, isSuperLike = false }: { likedId: string; isSuperLike?: boolean }) => {
      const res = await fetch(api.likes.create.path, {
        method: api.likes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likedId, isSuperLike }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to like profile");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.discover.path] });
      queryClient.invalidateQueries({ queryKey: [api.likes.received.path] });
      if (data.match) {
        toast({ title: "It's a Match!", description: "You both like each other!" });
      } else {
        toast({ title: "Liked!", description: "Your interest has been sent." });
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
