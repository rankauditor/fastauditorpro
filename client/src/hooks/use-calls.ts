import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Call } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all calls
export function useCalls() {
  return useQuery({
    queryKey: [api.calls.list.path],
    queryFn: async () => {
      const res = await fetch(api.calls.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calls");
      return api.calls.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single call with polling for active states
export function useCall(id: number) {
  return useQuery({
    queryKey: [api.calls.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.calls.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Call not found");
        throw new Error("Failed to fetch call details");
      }
      return api.calls.get.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds if processing
    refetchInterval: (query) => {
      const data = query.state.data as Call | undefined;
      if (data && ["uploading", "transcribing", "auditing"].includes(data.status)) {
        return 2000;
      }
      return false;
    },
  });
}

// Upload call
export function useUploadCall() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.calls.upload.path, {
        method: api.calls.upload.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.calls.upload.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Upload failed");
      }

      return api.calls.upload.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.calls.list.path] });
      toast({
        title: "Call Uploaded",
        description: `Analyzing ${data.filename}...`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Manually trigger analysis (if needed)
export function useAnalyzeCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.calls.analyze.path, { id });
      const res = await fetch(url, {
        method: api.calls.analyze.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Analysis failed to start");
      return api.calls.analyze.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.calls.get.path, id] });
    },
  });
}
