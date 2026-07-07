import React, { useState } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Shield, Play, ChevronRight, CheckCircle2, 
  UserCheck, AlertTriangle, Cpu, Terminal, ArrowUpRight 
} from 'lucide-react';
import { BadgesGroup } from '../components/Badges';

interface JudgeModeProps {
  lang: string;
  onSetFarmerId: (id: string) => void;
  onNavigate: (tab: string) => void;
  currentFarmerId: string;
}

export const JudgeMode: React.FC<JudgeModeProps> = ({ 
  lang, 
  onSetFarmerId, 
  onNavigate,
  currentFarmerId
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Select Critical Risk Profile",
      desc: "Simulate a farmer profile experiencing severe dry spells and pest indicators. Switch to Sreedharan Nair (Critical Risk) to inspect alerts.",
      actionLabel: "Set Sreedharan (Critical)",
      tech: "Seeded SQL database profile mapping soil pH, crop history, and irrigation details.",
      run: () => {
        onSetFarmerId("FARM-CRIT-992");
        onNavigate("dashboard");
      }
    },
    {
      title: "2. Inspect Smart Weather Alerts",
      desc: "Open the main Dashboard page to review top alerts showing critical Heatwave and Water Shortage warnings.",
      actionLabel: "Go to Dashboard Alerts",
      tech: "Weather risk heuristics engine combining 7-day humidity/UV index with soil parameters.",
      run: () => {
        onNavigate("dashboard");
      }
    },
    {
      title: "3. Run Crop Disease Identification",
      desc: "Navigate to the Disease Health Log log page to submit leaf images for diagnosis.",
      actionLabel: "Go to Crop Health Log",
      tech: "Multi-modal leaf diagnosis workflow. Prompts the farmer for speech input details.",
      run: () => {
        onNavigate("disease");
      }
    },
    {
      title: "4. Trigger Gemini Vision Diagnosis",
      desc: "In the Crop Health Log page, choose an leaf image and click the purple 'Analyze with Gemini Vision' button.",
      actionLabel: "Upload & Test Vision",
      tech: "Google Gemini 2.5 Flash Vision model. Scans structural image inputs server-side.",
      run: () => {
        onNavigate("disease");
      }
    },
    {
      title: "5. Synthesize AI Advisory Response",
      desc: "Open the Personal AI Assistant page. Type a question and view structured timelines, expected benefits, and confidence metrics.",
      actionLabel: "Go to AI Assistant Chat",
      tech: "Gemini 2.5 Flash Text model. Direct API requests wrapped in Pydantic schema validation.",
      run: () => {
        onNavigate("assistant");
      }
    },
    {
      title: "6. Audit Officer Command Console",
      desc: "Switch role to Agricultural Officer portal to inspect the global administrative overview.",
      actionLabel: "Go to Officer Console",
      tech: "Agronomist management CRM for case ticketing and remote district advisory audits.",
      run: () => {
        onNavigate("officer");
      }
    },
    {
      title: "7. Query District AI Intelligence Center",
      desc: "Click the 'Run System Audit' button in the Officer Console to review daily disease hotspots and action checklists.",
      actionLabel: "Generate District Intelligence",
      tech: "Gemini Copilot text analysis. Aggregates all open cases and risk parameters into a structured district brief.",
      run: () => {
        onNavigate("officer");
      }
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-nature-900 text-white p-6 rounded-2xl shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6">
          <Cpu size={220} />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-bold">
              Judge Mode Panel
            </span>
            <BadgesGroup badges={['ai', 'google']} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-sans">
            KisanVriddhi Guided Hackathon Tour
          </h2>
          <p className="text-indigo-100 text-xs md:text-sm leading-relaxed font-semibold">
            Use this panel to step through the critical evaluation criteria defined by Google AI hackathon judges. Verify full server-side Gemini text/vision integrations, confidence frameworks, and officer workflows instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Flow Checklist Tracker */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-premium space-y-4">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200 border-b border-gray-50 dark:border-zinc-800/50 pb-2.5">
            Walkthrough Checklist
          </h3>
          
          <div className="space-y-2">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-3 ${
                  currentStep === idx
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/50 text-indigo-700 dark:text-indigo-400'
                    : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800/60 text-gray-500'
                }`}
              >
                <div className="flex gap-2.5 items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep > idx 
                      ? 'bg-emerald-500 text-white' 
                      : currentStep === idx 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="truncate">{s.title.substring(3)}</span>
                </div>
                <ChevronRight size={14} className={currentStep === idx ? 'text-indigo-500' : 'text-gray-300'} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Step details & execution card */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-5"
            >
              <div className="flex justify-between items-start border-b border-gray-50 dark:border-zinc-850 pb-4">
                <div>
                  <span className="text-[9px] uppercase font-black text-indigo-600 tracking-wider">
                    Walkthrough Step {currentStep + 1} of {steps.length}
                  </span>
                  <h3 className="text-lg font-black text-gray-800 dark:text-zinc-200 mt-0.5">
                    {steps[currentStep].title}
                  </h3>
                </div>
                
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                  Current Profile: {currentFarmerId}
                </span>
              </div>

              <p className="text-xs text-gray-650 dark:text-zinc-350 leading-relaxed font-semibold">
                {steps[currentStep].desc}
              </p>

              {/* Action Button trigger */}
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-150/45 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider">
                    Interactive Trigger
                  </span>
                  <p className="text-[11px] font-extrabold text-gray-700 dark:text-zinc-300 mt-0.5">
                    Execute this step and navigate to targeted view
                  </p>
                </div>
                
                <button
                  onClick={steps[currentStep].run}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shrink-0 shadow-md"
                >
                  <Play size={14} className="fill-current" />
                  {steps[currentStep].actionLabel}
                </button>
              </div>

              {/* Technical Showcase under the hood */}
              <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-4 rounded-xl border border-indigo-150/30 space-y-2">
                <h4 className="font-extrabold text-indigo-750 dark:text-indigo-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Terminal size={12} /> Under the Hood: Technology Highlight
                </h4>
                <p className="text-xs text-gray-750 dark:text-zinc-300 font-medium leading-relaxed">
                  {steps[currentStep].tech}
                </p>
                <div className="pt-1.5 flex gap-2">
                  <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-200/50">
                    Server-Side
                  </span>
                  <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-200/50">
                    Google Cloud
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition disabled:opacity-40"
                >
                  Previous Step
                </button>
                
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl text-xs font-bold text-gray-700 transition"
                  >
                    Next Step <ArrowUpRight size={14} />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Guided Walkthrough Complete!
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
