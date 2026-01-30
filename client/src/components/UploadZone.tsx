import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileAudio, AlertCircle, Clock, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { useUploadCall } from "@/hooks/use-calls";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

interface QueueJob {
  id: string;
  filename: string;
  status: "pending" | "processing" | "done" | "failed";
  result: any | null;
  error: string | null;
  callId: number | null;
  createdAt: string;
}

export function UploadZone() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  const { data: queue, refetch: refetchQueue } = useQuery<QueueJob[]>({
    queryKey: ["queue"],
    queryFn: async () => {
      const res = await fetch("/api/queue");
      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/queue/add", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to add to queue");
      return res.json();
    },
    onSuccess: () => {
      refetchQueue();
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setShowQueue(true);
    },
  });

  useEffect(() => {
    if (queue && queue.some((j) => j.status === "processing" || j.status === "pending")) {
      const interval = setInterval(() => {
        refetchQueue();
        queryClient.invalidateQueries({ queryKey: ["calls"] });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [queue, refetchQueue, queryClient]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) return;

    const validFiles = acceptedFiles.filter((file) => {
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setError("Please upload valid audio files (max 50MB each).");
      return;
    }

    if (validFiles.length === 1) {
      addToQueueMutation.mutate(validFiles);
    } else {
      addToQueueMutation.mutate(validFiles);
    }
  }, [addToQueueMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg"],
      "video/*": [".mp4", ".mov", ".webm"]
    },
    disabled: addToQueueMutation.isPending,
    multiple: true
  });

  const isPending = addToQueueMutation.isPending;
  const activeJobs = queue?.filter((j) => j.status === "pending" || j.status === "processing") || [];
  const recentJobs = queue?.slice(0, 10) || [];

  const getStatusIcon = (status: QueueJob["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-slate-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: QueueJob["status"]) => {
    switch (status) {
      case "pending":
        return "Waiting";
      case "processing":
        return "Processing";
      case "done":
        return "Completed";
      case "failed":
        return "Failed";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragActive 
            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.01]" 
            : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50",
          isPending && "pointer-events-none opacity-80"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="relative p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className={cn(
            "p-4 rounded-full transition-colors duration-300",
            isDragActive ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            {isPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <UploadCloud className="w-8 h-8" />
              </motion.div>
            ) : (
              <FileAudio className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-semibold text-lg text-slate-900">
              {isPending ? "Adding to queue..." : "Upload Call Recording"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? "Drop the files here to start analysis" 
                : "Drag & drop audio file or click to browse"}
            </p>
          </div>

          <div className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Supports MP3, WAV, M4A, MP4 (Max 50MB) - Multiple files allowed
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {activeJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-medium text-sm text-slate-700">
              Processing Queue ({activeJobs.length} active)
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowQueue(!showQueue)}>
              {showQueue ? "Hide" : "Show All"}
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {(showQueue ? recentJobs : activeJobs).map((job) => (
              <div key={job.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                    {job.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    job.status === "done" && "bg-green-50 text-green-700",
                    job.status === "failed" && "bg-red-50 text-red-700",
                    job.status === "processing" && "bg-primary/10 text-primary",
                    job.status === "pending" && "bg-slate-100 text-slate-600"
                  )}>
                    {getStatusText(job.status)}
                  </span>
                  {job.status === "done" && job.callId && (
                    <Link href={`/calls/${job.callId}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
