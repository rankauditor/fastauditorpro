import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, FileAudio, BrainCircuit } from "lucide-react";

type Status = "uploading" | "transcribing" | "auditing" | "completed" | "failed" | string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    uploading: {
      icon: Loader2,
      label: "Uploading",
      classes: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
      iconClass: "animate-spin"
    },
    transcribing: {
      icon: FileAudio,
      label: "Transcribing",
      classes: "bg-purple-100 text-purple-700 border-purple-200",
      iconClass: "animate-pulse"
    },
    auditing: {
      icon: BrainCircuit,
      label: "Analyzing",
      classes: "bg-amber-100 text-amber-700 border-amber-200",
      iconClass: "animate-pulse"
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconClass: ""
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      classes: "bg-red-100 text-red-700 border-red-200",
      iconClass: ""
    }
  };

  const current = config[status as keyof typeof config] || {
    icon: Loader2,
    label: status,
    classes: "bg-slate-100 text-slate-700 border-slate-200",
    iconClass: ""
  };

  const Icon = current.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm",
      current.classes,
      className
    )}>
      <Icon className={cn("w-3.5 h-3.5", current.iconClass)} />
      {current.label}
    </span>
  );
}
