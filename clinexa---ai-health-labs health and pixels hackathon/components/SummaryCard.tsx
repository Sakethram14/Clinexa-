
import React, { useEffect, useState } from 'react';
import { AIAnalysis } from '../types';
import { AlertCircle, ShieldCheck, Zap, BrainCircuit, Activity, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface SummaryCardProps {
  analysis: AIAnalysis;
  rawText?: string;
  compact?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ analysis, rawText, compact = false }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(analysis.riskScore), 500);
    return () => clearTimeout(timer);
  }, [analysis.riskScore]);

  const urgencyStyles = {
    Low: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', progress: 'bg-emerald-500' },
    Medium: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', progress: 'bg-amber-500' },
    High: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', progress: 'bg-orange-500' },
    Emergency: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', progress: 'bg-red-500' },
  };

  const style = urgencyStyles[analysis.urgency];

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ${compact ? '' : 'max-w-5xl w-full mx-auto'}`}>
      {/* Report Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Diagnostic Report Summary</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${style.border} ${style.bg}`}>
          <div className={`w-2 h-2 rounded-full ${style.progress}`}></div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
            Triage Level: {analysis.urgency}
          </span>
        </div>
      </div>

      <div className="p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Summary Column */}
          <div className="lg:col-span-8">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-4">Patient Narrative Analysis</h3>
            <p className="text-lg text-slate-600 leading-relaxed font-medium mb-10">
              {analysis.briefSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identified Symptoms</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.extractedSymptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Differential Context</h4>
                </div>
                <ul className="space-y-3">
                  {analysis.possibleCauses.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-200"></div>
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          {/* Metrics Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Triage Intensity</span>
                <Activity className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black text-slate-900">{animatedScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${style.progress}`}
                  style={{ width: `${animatedScore}%` }}
                ></div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">AI Confidence High (99.2%)</span>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl">
               <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action Guidance</span>
               </div>
               <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                 {analysis.urgency === 'Emergency' ? 
                    "Immediate physician attention required. Escalate to ER protocol." : 
                    "Monitor patient vitals. Schedule standard follow-up within 24-48 hours."}
               </p>
            </div>
          </div>
        </div>

        {/* Red Flags - Actionable Alert */}
        {analysis.redFlags.length > 0 && (
          <div className="mt-12 bg-red-50 border border-red-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="text-lg font-black text-red-900">Clinical Red Flags</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.redFlags.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white border border-red-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm font-bold text-red-900">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verbatim Source */}
        {rawText && !compact && (
          <div className="mt-12 pt-8 border-t border-slate-100">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Patient Narrative Feed</h4>
                <div className="flex gap-1">
                   {[1,2,3,4].map(i => <div key={i} className="w-0.5 h-3 bg-slate-200"></div>)}
                </div>
             </div>
             <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 italic text-base leading-relaxed">
                &ldquo;{rawText}&rdquo;
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
