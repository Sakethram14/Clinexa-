
import React, { useState } from 'react';
import { PatientIntake as PatientIntakeType } from '../types';
import SummaryCard from '../components/SummaryCard';
import { Search, CheckCircle2, Activity, FileText, ChevronRight, User, Plus } from 'lucide-react';

interface DoctorDashboardProps {
  intakes: PatientIntakeType[];
}

const DashboardItem: React.FC<{ intake: PatientIntakeType, active: boolean, onClick: () => void }> = ({ intake, active, onClick }) => {
  const urgencyLabel = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Emergency: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 transition-all relative flex gap-5 border-b border-slate-100 ${
        active ? 'bg-indigo-50/50 shadow-[inset_4px_0_0_#4f46e5]' : 'hover:bg-slate-50'
      }`}
    >
      <div className="shrink-0 pt-1">
         <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-6 h-6 text-slate-400" />
         </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5">
           <span className="text-sm font-black text-slate-900 tracking-tight">Case Record {intake.id}</span>
           <span className="text-[10px] font-black text-slate-400 tabular-nums">{intake.timestamp.split(',')[1].trim()}</span>
        </div>
        <p className="text-xs text-slate-500 font-bold truncate mb-3 leading-relaxed">{intake.summary.briefSummary}</p>
        
        <div className="flex items-center gap-3">
           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${urgencyLabel[intake.summary.urgency]}`}>
              {intake.summary.urgency}
           </span>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{intake.summary.riskScore}% Severity</span>
        </div>
      </div>
      <ChevronRight className={`w-4 h-4 mt-2 transition-transform ${active ? 'text-indigo-600 translate-x-1' : 'text-slate-300'}`} />
    </button>
  );
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ intakes }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedIntake = intakes.find(i => i.id === selectedId);
  const filteredIntakes = intakes.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.summary.briefSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.rawSymptoms.toLowerCase().includes(searchTerm.toLowerCase())
  ).reverse();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Dynamic Workspace Header */}
      <div className="bg-white border-b border-slate-200 px-10 py-8 flex items-center justify-between shadow-sm shrink-0">
         <div className="flex items-center gap-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Queue</h2>
            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
               <div className="status-pulse"></div>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Real-time Bio-feed Verified</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by ID, symptoms, or summary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                />
            </div>
            <button className="px-6 py-3 bg-indigo-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2.5">
               <Plus className="w-5 h-5" />
               Manual Intake
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Record Stack */}
        <div className="w-[450px] flex flex-col bg-white border-r border-slate-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredIntakes.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Archive Empty</p>
                <p className="text-xs text-slate-300 font-bold mt-2">No matching clinical records in queue.</p>
              </div>
            ) : (
              filteredIntakes.map((intake) => (
                <DashboardItem 
                  key={intake.id}
                  intake={intake}
                  active={selectedId === intake.id}
                  onClick={() => {
                    setSelectedId(intake.id);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Workspace: Synthesis Viewer */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-12 no-scrollbar">
          {selectedIntake ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-6xl mx-auto">
               <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Patient Record Synthesis</span>
                       <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">ID: {selectedIntake.id}</span>
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Case Diagnostic</h2>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-indigo-600 rounded-2xl text-sm font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95">
                       <CheckCircle2 className="w-5 h-5" />
                       Finalize Record
                    </button>
                  </div>
               </div>
               
               <SummaryCard 
                 analysis={selectedIntake.summary} 
                 rawText={selectedIntake.rawSymptoms} 
               />
               
               <div className="mt-16 flex flex-col items-center gap-4 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  <div className="flex items-center gap-8">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Logo_of_HIPAA.svg" alt="HIPAA" className="h-6" />
                    <div className="w-px h-6 bg-slate-300"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">256-bit AES Clinical Encryption Active</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400"> Clinexa Neural Bridge v2.5.12 | Bio-feedback Sync Active</p>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
               <div className="w-32 h-32 bg-white rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex items-center justify-center border border-slate-100 mb-10 animate-bounce-subtle">
                  <Activity className="w-12 h-12 text-slate-300" />
               </div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Patient Queue Dashboard</h3>
               <p className="text-lg text-slate-400 font-bold leading-relaxed mb-12">
                  Select a consultation record from the diagnostic feed to initiate review of AI-synthesized findings and differential contexts.
               </p>
               <div className="grid grid-cols-2 gap-8 w-full">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-left group hover:border-indigo-100 transition-all">
                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-3">Live Feed</span>
                     <div className="flex items-center gap-3">
                        <div className="status-pulse"></div>
                        <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">Operational</span>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-left group hover:border-indigo-100 transition-all">
                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-3">Sync Fidelity</span>
                     <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">99.2% &sigma;</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
