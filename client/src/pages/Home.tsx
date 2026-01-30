import { useCalls } from "@/hooks/use-calls";
import { Layout } from "@/components/Layout";
import { UploadZone } from "@/components/UploadZone";
import { CallCard } from "@/components/CallCard";
import { Loader2, AudioWaveform } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: calls, isLoading } = useCalls();

  return (
    <Layout>
      <div className="space-y-12">
        {/* Header & Upload Section */}
        <section className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight"
            >
              AI-Powered <span className="text-primary">Call Quality</span> Assurance
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-500 max-w-2xl mx-auto"
            >
              Upload your sales calls or support recordings. Get instant, actionable feedback and automated scoring.
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <UploadZone />
          </motion.div>
        </section>

        {/* Recent Audits Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <AudioWaveform className="w-5 h-5 text-primary" />
              Recent Audits
            </h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {calls?.length || 0} Calls
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : calls?.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No calls audited yet. Upload one above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calls?.map((call, i) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CallCard call={call} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
