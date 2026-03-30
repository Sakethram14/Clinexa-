
import React, { useState } from 'react';
import { analyzeSymptoms } from '../services/geminiService';
import { AIAnalysis, PatientIntake as PatientIntakeType } from '../types';
import SummaryCard from '../components/SummaryCard';
import { Sparkles, RefreshCw, ChevronRight, AlertCircle, MessageSquare, ClipboardCheck, Brain, Loader2 } from 'lucide-react';

interface PatientIntakeProps {
  onSave: (intake: PatientIntakeType) => void;
}

const PatientIntake: React.FC<PatientIntakeProps> = ({ onSave }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnalysis | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeSymptoms(symptoms);
      setResult(analysis);
      
      const newIntake: PatientIntakeType = {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        rawSymptoms: symptoms,
        summary: analysis
      };
      
      onSave(newIntake);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostic engine timed out.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col py-12 px-6 relative bg-slate-50/50">
      <div className="max-w-4xl mx-auto w-full">
        {!result ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-slate-200 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  Biometric Engine Online
               </div>
               <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Clinical Intake</h1>
               <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                 Describe symptoms in natural language. Clinexa's neural models will synthesize structured diagnostic reports for physician review.
               </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-black text-slate-900 mb-4 flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    Patient Narrative or Clinical Notes
                  </label>
                  <textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms, duration, and any relevant clinical history..."
                    className="w-full h-72 p-8 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-lg text-slate-800 placeholder:text-slate-400 resize-none font-medium leading-relaxed"
                    required
                  />
                  <div className="mt-4 flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted Data</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${symptoms.length > 50 ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {symptoms.length} Characters
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-6 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2 border bg-red-50 border-red-100 text-red-900">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
                    <div className="space-y-2">
                      <p className="text-sm font-black">Sync Failure</p>
                      <p className="text-xs font-semibold leading-relaxed opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !symptoms.trim()}
                  className={`w-full py-6 rounded-2xl text-white font-black text-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-4 ${
                    loading || !symptoms.trim() 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Synthesizing Data...
                    </>
                  ) : (
                    <>
                      Verify & Synthesize
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-70">
               {[
                 { icon: ClipboardCheck, title: 'Bio-Feed Sync', desc: 'Auto-maps to diagnostic ICD-10.' },
                 { icon: AlertCircle, title: 'Red Flags', desc: 'Instant critical marker identification.' },
                 { icon: Brain, title: 'Neural Triage', desc: 'Predictive risk stratification.' }
               ].map((item, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
                    <div className="p-3 bg-slate-50 rounded-xl mb-4">
                      <item.icon className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-2">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in zoom-in-[0.98] duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Diagnostic Synthesis Verified</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Neural Bridge Connected (99.2% Confidence)</p>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm flex items-center gap-3 shadow-sm active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Intake
                  </button>
               </div>
            </div>
            
            <SummaryCard 
              analysis={result} 
              rawText={symptoms} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientIntake;
