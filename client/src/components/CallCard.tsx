import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Call } from "@shared/schema";
import type { AuditResult } from "@shared/schema";

interface CallCardProps {
  call: Call;
}

export function CallCard({ call }: CallCardProps) {
  const result = call.auditResult as AuditResult | null;
  const score = result?.overall_score;

  return (
    <Link href={`/calls/${call.id}`} className="block group">
      <div className="relative bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-display font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
              {call.filename}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {call.createdAt && formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
              </span>
              {call.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {call.duration}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={call.status} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
              Verdict
            </span>
            <span className={`text-sm font-medium ${
              result?.verdict === "Pass" ? "text-emerald-600" :
              result?.verdict === "Fail" ? "text-red-600" :
              "text-slate-500"
            }`}>
              {result?.verdict || "—"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                Score
              </span>
              <span className="text-lg font-bold font-display text-slate-900">
                {score !== undefined ? score : "—"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
