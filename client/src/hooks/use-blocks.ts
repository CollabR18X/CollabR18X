import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useBlocks() {
  return useQuery({
    queryKey: [api.blocks.list.path],
    queryFn: async () => {
      const res = await fetch(api.blocks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blocked users");
      return res.json();
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const res = await fetch(api.blocks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to block user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.blocks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/discover"] });
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
      toast({ title: "User blocked", description: "This user has been blocked." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (blockId: number) => {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unblock user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.blocks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/discover"] });
      toast({ title: "User unblocked", description: "This user has been unblocked." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
