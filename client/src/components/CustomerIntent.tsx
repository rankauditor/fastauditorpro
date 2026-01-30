import { User, MessageCircle, TrendingUp, TrendingDown, HelpCircle, DollarSign, Search, PhoneOff } from "lucide-react";
import type { CustomerIntent as CustomerIntentType } from "@shared/schema";

interface CustomerIntentProps {
  intent: CustomerIntentType;
}

const intentConfig: Record<string, { icon: typeof User; color: string; bgColor: string }> = {
  "Interested": { icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  "Not Interested": { icon: TrendingDown, color: "text-red-600", bgColor: "bg-red-50" },
  "Needs Follow-Up": { icon: HelpCircle, color: "text-amber-600", bgColor: "bg-amber-50" },
  "Price Concern": { icon: DollarSign, color: "text-blue-600", bgColor: "bg-blue-50" },
  "Just Researching": { icon: Search, color: "text-purple-600", bgColor: "bg-purple-50" },
  "Wrong Contact": { icon: PhoneOff, color: "text-slate-600", bgColor: "bg-slate-100" },
};

const confidenceColors: Record<string, string> = {
  "High": "bg-emerald-100 text-emerald-700",
  "Medium": "bg-amber-100 text-amber-700",
  "Low": "bg-slate-100 text-slate-600",
};

export function CustomerIntent({ intent }: CustomerIntentProps) {
  const config = intentConfig[intent.intent] || { icon: User, color: "text-slate-600", bgColor: "bg-slate-50" };
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-slate-900">Customer Intent</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
          <span className={`text-lg font-bold ${config.color}`}>{intent.intent}</span>
        </div>
        
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${confidenceColors[intent.confidence] || confidenceColors["Medium"]}`}>
          {intent.confidence} Confidence
        </span>
      </div>
      
      {intent.evidence && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-1">Supporting Evidence</p>
          <p className="text-slate-700 italic">"{intent.evidence}"</p>
        </div>
      )}
    </div>
  );
}
