import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Quote } from "lucide-react";
import type { AuditResult, AuditQuestion } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AuditResultsProps {
  result: AuditResult;
}

export function AuditResults({ result }: AuditResultsProps) {
  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <section>
        <h3 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Executive Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.summary.map((point, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed"
            >
              • {point}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Questions Section */}
      <section>
        <h3 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Detailed Audit
        </h3>
        <div className="space-y-3">
          {result.questions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuestionCard({ question, index }: { question: AuditQuestion; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (answer: string) => {
    switch(answer) {
      case "Yes": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "No": return "text-red-600 bg-red-50 border-red-100";
      case "Partial": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const getIcon = (answer: string) => {
    switch(answer) {
      case "Yes": return <CheckCircle2 className="w-5 h-5" />;
      case "No": return <XCircle className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left bg-white hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-full border shrink-0", getStatusColor(question.answer))}>
            {getIcon(question.answer)}
          </div>
          <div>
            <h4 className="font-medium text-slate-900 text-sm md:text-base pr-4">
              {question.question}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", getStatusColor(question.answer))}>
                {question.answer}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Score: {question.score}/10
              </span>
            </div>
          </div>
        </div>
        <div className="text-slate-400 shrink-0 ml-2">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
          >
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Feedback
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {question.feedback}
                </p>
              </div>
              
              {question.evidence && (
                <div className="relative pl-4 border-l-2 border-primary/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">
                    Evidence
                  </span>
                  <div className="text-sm text-slate-600 italic relative">
                    <Quote className="w-4 h-4 absolute -left-6 -top-1 text-slate-300" />
                    "{question.evidence}"
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
