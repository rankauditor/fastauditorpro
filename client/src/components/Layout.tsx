import { Link, useLocation } from "wouter";
import { Mic, BarChart3, Settings, Github } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 sticky top-0 h-auto md:h-screen z-20 flex-shrink-0">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="bg-primary text-white p-2 rounded-lg shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                <Mic className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-slate-900 tracking-tight">
                CallAudit<span className="text-primary">.ai</span>
              </span>
            </div>
          </Link>
        </div>

        <nav className="px-3 py-2 space-y-1">
          <Link href="/">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer",
              location === "/" || location.startsWith("/calls")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}>
              <BarChart3 className={cn("w-4 h-4", (location === "/" || location.startsWith("/calls")) && "text-primary")} />
              Audit Dashboard
            </div>
          </Link>
          <Link href="/settings">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer",
              location === "/settings"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}>
              <Settings className={cn("w-4 h-4", location === "/settings" && "text-primary")} />
              Settings
            </div>
          </Link>
        </nav>

      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-end">
          <a href="https://github.com" target="_blank" rel="noopener" className="text-slate-400 hover:text-slate-900 transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </header>
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
