import { useRoute, Link } from "wouter";
import { useCall } from "@/hooks/use-calls";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { AuditResults } from "@/components/AuditResults";
import { CustomerIntent } from "@/components/CustomerIntent";
import { ChevronLeft, Loader2, Calendar, Clock, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import type { AuditResult, CustomerIntent as CustomerIntentType } from "@shared/schema";

export default function CallDetails() {
  const [, params] = useRoute("/calls/:id");
  const id = parseInt(params?.id || "0");
  const { data: call, isLoading, error } = useCall(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium animate-pulse">Loading audit data...</p>
        </div>
      </Layout>
    );
  }

  if (error || !call) {
    return (
      <Layout>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Audit Not Found</h2>
          <p className="text-slate-500 max-w-md">
            We couldn't locate the audit you're looking for. It might have been deleted or the ID is incorrect.
          </p>
          <Link href="/" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
            Return Home
          </Link>
        </div>
      </Layout>
    );
  }

  const result = call.auditResult as AuditResult | null;
  const isProcessing = ["uploading", "transcribing", "auditing"].includes(call.status);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={call.status} />
                <span className="text-xs font-mono text-slate-400">ID: #{call.id}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
                {call.filename}
              </h1>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {call.createdAt && format(new Date(call.createdAt), "PPP")}
                </span>
                {call.duration && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {call.duration}
                  </span>
                )}
              </div>
            </div>

            {result && (
              <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 w-full md:w-auto">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-slate-500">Overall Score</div>
                  <div className={`text-sm font-bold ${
                    result.verdict === "Pass" ? "text-emerald-600" :
                    result.verdict === "Fail" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {result.verdict.toUpperCase()}
                  </div>
                </div>
                <ScoreRing score={result.overall_score} size={80} strokeWidth={6} />
              </div>
            )}
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Analysis in Progress
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Our AI is currently processing your recording. This usually takes 1-2 minutes depending on the call duration. The page will update automatically.
            </p>
          </div>
        )}

        {/* Failed State */}
        {call.status === "failed" && (
          <div className="bg-red-50 rounded-2xl p-8 border border-red-100 text-center">
            <h3 className="text-lg font-bold text-red-700 mb-2">Analysis Failed</h3>
            <p className="text-red-600">
              There was an error processing this file. Please ensure the audio is clear and in a supported format.
            </p>
          </div>
        )}

        {/* Completed State - Results */}
        {call.status === "completed" && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Analysis Column */}
            <div className="lg:col-span-2 space-y-6">
              {result.customer_intent && (
                <CustomerIntent intent={result.customer_intent} />
              )}
              <AuditResults result={result} />
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Transcript Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-24">
                <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Transcript
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto text-sm text-slate-600 leading-relaxed border border-slate-100">
                  {call.transcript || "Transcript not available."}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors border border-slate-200 rounded-lg hover:border-primary/50 hover:bg-slate-50">
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
