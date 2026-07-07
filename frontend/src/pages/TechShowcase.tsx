import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Database, Sparkles, Terminal, Code2, 
  CheckCircle, HelpCircle, Layers, TableProperties, Network
} from 'lucide-react';
import { BadgesGroup } from '../components/Badges';

export const TechShowcase: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title Header */}
      <div className="bg-gradient-to-br from-nature-600 to-nature-800 text-white p-6 rounded-2xl shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
          <Layers size={200} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-bold">
              Technology Stack
            </span>
            <BadgesGroup badges={['ai', 'google']} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-sans">
            Google AI Stack Showcase
          </h2>
          <p className="text-nature-100 text-xs md:text-sm leading-relaxed font-semibold">
            Under the hood overview of how KisanVriddhi coordinates multi-modal AI APIs, weather alert heuristics, and offline fallback databases to maximize crop yield outputs.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4">
        <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
          <Network className="h-4.5 w-4.5 text-nature-600 animate-pulse" />
          KisanVriddhi End-to-End Multimodal Data Pipeline Flow
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
          {[
            { label: "Farmer Profile", desc: "Soil pH, Land, Crop history" },
            { label: "Voice AI Helper", desc: "STT Input / TTS Readout" },
            { label: "Gemini Advisory", desc: "Server-side context prompt" },
            { label: "Weather Engine", desc: "Rain, Temp, UV forecasts" },
            { label: "Gemini Vision", desc: "Multimodal leaf diagnosis" },
            { label: "Risk Engine", desc: "Active alerts & crop match" },
            { label: "Officer Console", desc: "District Intelligence Briefs" },
            { label: "Action Plan", desc: "7-Day mitigation tasks" }
          ].map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-gray-150/50 w-[145px] text-center shadow-sm">
                <span className="bg-nature-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full block w-fit mx-auto mb-1">
                  Step {idx + 1}
                </span>
                <p className="font-extrabold text-xs text-gray-800 dark:text-zinc-200 truncate">{step.label}</p>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-medium">{step.desc}</p>
              </div>
              {idx < arr.length - 1 && (
                <span className="text-gray-300 dark:text-zinc-700 font-black text-sm shrink-0">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Why KisanVriddhi? - Judge Comparison Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4">
        <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
          <TableProperties className="h-4.5 w-4.5 text-nature-600" />
          The KisanVriddhi Advantage: Hackathon Evaluation Matrix
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-150 dark:border-zinc-800 font-bold text-gray-400 bg-gray-50 dark:bg-zinc-850">
                <th className="p-3">Feature Checklist</th>
                <th className="p-3">Traditional Agritech Apps</th>
                <th className="p-3 text-nature-700 dark:text-nature-400">KisanVriddhi Ecosystem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-850 font-semibold text-gray-700 dark:text-zinc-350">
              <tr>
                <td className="p-3 font-bold text-gray-800 dark:text-zinc-200">Weather Warnings</td>
                <td className="p-3">❌ Static/General forecasts only</td>
                <td className="p-3 text-nature-600">✓ Weather Aware Alerts tailored to crop log profile</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800 dark:text-zinc-200">AI Leaf Diagnostics</td>
                <td className="p-3">❌ Disease database checklists only</td>
                <td className="p-3 text-nature-600">✓ Server-Side Gemini 2.5 Flash Vision Multimodal Analysis</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800 dark:text-zinc-200">Expert Advisory</td>
                <td className="p-3">❌ Generic lookup guides</td>
                <td className="p-3 text-nature-600">✓ Personalized Action Plans, strength & evidence lists</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800 dark:text-zinc-200">Officer Escalations</td>
                <td className="p-3">❌ Manual phone numbers listed</td>
                <td className="p-3 text-nature-600">✓ CRM Case Tickets, district intelligence dashboards</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-gray-800 dark:text-zinc-200">Voice Integration</td>
                <td className="p-3">❌ Text input only</td>
                <td className="p-3 text-nature-600">✓ Full Voice activation controls (Web Speech STT/TTS)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Architecture diagram & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Architecture Components */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
            <Network className="h-4.5 w-4.5 text-nature-600" />
            AI Pipeline Architecture
          </h3>
          
          <div className="space-y-4 text-xs font-semibold">
            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-150/40">
              <span className="text-nature-600 font-extrabold text-[9px] uppercase tracking-wider block mb-1">
                Gemini 2.5 Flash Advisory Client
              </span>
              <p className="text-gray-600 dark:text-zinc-350 leading-relaxed font-medium">
                Fetches current farmer soil configuration, crop history, rainfall indexes, and weather alerts from PostgreSQL to construct a secure server-side context block. Resolves Gemini API parameters securely using JSON MIME-type specifications.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-150/40">
              <span className="text-nature-600 font-extrabold text-[9px] uppercase tracking-wider block mb-1">
                Gemini 2.5 Flash Vision Endpoint
              </span>
              <p className="text-gray-600 dark:text-zinc-350 leading-relaxed font-medium">
                Decodes binary image files uploaded by farmers and executes a vision analysis prompting for severity levels, physical symptom remarks, and treatment rationales.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-gray-150/40">
              <span className="text-nature-600 font-extrabold text-[9px] uppercase tracking-wider block mb-1">
                District AI Summary Copilot
              </span>
              <p className="text-gray-600 dark:text-zinc-350 leading-relaxed font-medium">
                Periodically scans administrative agricultural database logs to extract hotspot risk parameters, critical priority outreaches, and checkable action items for district officials.
              </p>
            </div>
          </div>
        </div>

        {/* Backend & Deployment Stack */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200 flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
            <Cpu className="h-4.5 w-4.5 text-nature-600" />
            Infrastructure Stack
          </h3>
          
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-nature-600 rounded-full shrink-0" />
              <div>
                <p className="text-gray-800 dark:text-zinc-250 font-bold">FastAPI Python Backend</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">High performance async framework resolving database connections, mock weather indexes, and API clients.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-nature-600 rounded-full shrink-0" />
              <div>
                <p className="text-gray-800 dark:text-zinc-250 font-bold">React & Vite Frontend</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">Ultra-responsive visual client using Framer Motion animations and premium layout models.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-nature-600 rounded-full shrink-0" />
              <div>
                <p className="text-gray-800 dark:text-zinc-250 font-bold">PostgreSQL Database Layer</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">Relational storage persisting logs, farmer soil profiles, weather triggers, and cases with migration verifiers.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-nature-600 rounded-full shrink-0" />
              <div>
                <p className="text-gray-800 dark:text-zinc-250 font-bold">Speech Web API (STT & TTS)</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">Client side text-to-speech voice readouts and automated speech-to-text recognition controls.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
