
import React from 'react';
import { Page } from '../types';
import { LayoutDashboard, ClipboardList, HeartPulse, Bell, Settings, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Professional Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-[100] flex items-center px-6">
        <div className="w-full max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group" 
              onClick={() => onNavigate(Page.INTAKE)}
            >
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Clinexa</span>
            </div>

            <nav className="flex items-center ml-4">
              <button
                onClick={() => onNavigate(Page.INTAKE)}
                className={`px-4 h-16 flex items-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                  currentPage === Page.INTAKE 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Intake Portal
              </button>
              <button
                onClick={() => onNavigate(Page.DASHBOARD)}
                className={`px-4 h-16 flex items-center gap-2 text-sm font-semibold border-b-2 transition-all ${
                  currentPage === Page.DASHBOARD 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Clinical Dashboard
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search patient record..." 
                className="bg-transparent text-xs outline-none w-full text-slate-600"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-none">Dr. Alexander Vane</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">Clinical Lead</div>
                </div>
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander" 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span>&copy; 2025 Clinexa Health</span>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-slate-600">HIPAA Compliance</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="status-pulse mr-1"></div>
            System Operational
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
