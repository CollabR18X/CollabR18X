import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCollaboration } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useCollaborations() {
  return useQuery({
    queryKey: [api.collaborations.list.path],
    queryFn: async () => {
      const res = await fetch(api.collaborations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch collaborations");
      return api.collaborations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCollaboration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCollaboration & { receiverId: string }) => {
      const validated = api.collaborations.create.input.parse(data);
      const res = await fetch(api.collaborations.create.path, {
        method: api.collaborations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.collaborations.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create collaboration request");
      }
      return api.collaborations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.collaborations.list.path] });
      toast({ title: "Sent!", description: "Collaboration request sent successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCollaborationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) => {
      const url = buildUrl(api.collaborations.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.collaborations.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      return api.collaborations.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.collaborations.list.path] });
      toast({ 
        title: variables.status === 'accepted' ? "Accepted!" : "Rejected", 
        description: `Collaboration request ${variables.status}.` 
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
