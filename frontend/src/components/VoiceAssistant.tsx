import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge, BadgesGroup } from './Badges';

interface VoiceAssistantProps {
  lang: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ lang }) => {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  let recognition: any = null;
  if ('webkitSpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-IN';
  }

  const startListening = () => {
    if (!recognition) {
      // Simulate speech for unsupported browsers
      setRecognizing(true);
      setTranscript('Listening...');
      setTimeout(() => {
        const mockQuestions = [
          "Will it rain tomorrow in my district?",
          "How much fertilizer should I apply for black soil?",
          "My tomato crop leaves have brown spots, what should I do?",
          "Show me the weather alert report"
        ];
        const randomQ = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
        setTranscript(randomQ);
        setRecognizing(false);
        handleSendQuery(randomQ);
      }, 2500);
      return;
    }

    setTranscript('');
    setAiResponse(null);
    window.speechSynthesis.cancel();
    setSpeaking(false);
    
    recognition.onstart = () => {
      setRecognizing(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setRecognizing(false);
    };

    recognition.onend = () => {
      setRecognizing(false);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      handleSendQuery(resultText);
    };

    recognition.start();
  };

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    try {
      setLoading(true);
      const res = await api.sendGeminiMessage({ message: queryText, language: lang });
      setAiResponse(res);
      
      // Auto TTS response
      if (speechEnabled) {
        speakText(res.recommendation + ". Why: " + res.why);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\*\*/g, '').replace(/[\#\*\_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium relative overflow-hidden text-center">
        <div className="absolute right-3 top-3">
          <button 
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              speechEnabled ? 'bg-nature-50 border-nature-200 text-nature-600' : 'bg-gray-50 border-gray-150 text-gray-400'
            }`}
            title={speechEnabled ? 'Voice readout enabled' : 'Voice readout disabled'}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="bg-gradient-to-br from-nature-500/10 to-nature-600/5 p-4 rounded-full border border-nature-500/10 mb-2">
            <h2 className="text-xl font-black text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 justify-center">
              <Sparkles className="h-5.5 w-5.5 text-nature-600 animate-pulse" />
              KisanVriddhi Voice advisory
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Speak in Hindi, Telugu, Malayalam, or English</p>
          </div>

          {/* Dynamic Animated Recording Waveform */}
          <div className="relative flex items-center justify-center h-28 w-28">
            <AnimatePresence>
              {recognizing && (
                <>
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    className="absolute inset-0 bg-nature-500 rounded-full"
                  />
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    className="absolute inset-0 bg-nature-400 rounded-full"
                  />
                </>
              )}
            </AnimatePresence>

            <button
              onClick={recognizing ? () => {} : startListening}
              disabled={loading}
              className={`h-20 w-20 rounded-full flex items-center justify-center transition shadow-lg relative z-10 ${
                recognizing 
                  ? 'bg-red-500 text-white' 
                  : 'bg-nature-600 hover:bg-nature-700 text-white hover:scale-105'
              }`}
            >
              {recognizing ? <MicOff size={32} className="animate-pulse" /> : <Mic size={32} />}
            </button>
          </div>

          <div className="space-y-2 max-w-lg">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {recognizing ? 'Listening to speech...' : 'Press Mic to Ask Advisory'}
            </span>
            {transcript && (
              <p className="text-sm font-extrabold text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-800/40 px-4 py-3 rounded-xl border border-gray-150/45 italic leading-relaxed">
                "{transcript}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Render Advisory Speech Response */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-8 text-center shadow-premium flex flex-col items-center justify-center min-h-[25vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nature-600 mb-4"></div>
            <p className="text-xs font-bold text-gray-450">Gemini 2.5 Advisory synthesis in progress...</p>
          </div>
        ) : aiResponse ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-5 text-xs font-semibold"
          >
            <div className="border-b border-gray-50 dark:border-zinc-850 pb-4 flex flex-wrap justify-between items-start gap-4">
              <div>
                <BadgesGroup badges={['ai', 'google', 'weather']} />
                <h3 className="text-lg font-black text-gray-800 dark:text-zinc-200 mt-2.5">
                  Voice Advisory Report
                </h3>
              </div>
              
              <div className="flex gap-2">
                {speaking ? (
                  <button 
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200/50 rounded-xl text-[11px] font-extrabold transition animate-pulse"
                  >
                    <VolumeX size={14} /> Stop Speech Readout
                  </button>
                ) : (
                  <button 
                    onClick={() => speakText(aiResponse.recommendation + ". Why: " + aiResponse.why)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-nature-50 text-nature-600 hover:bg-nature-100 border border-nature-200/50 rounded-xl text-[11px] font-extrabold transition"
                  >
                    <Volume2 size={14} /> Play Speech Readout
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-nature-50/30 dark:bg-nature-950/15 p-4 rounded-xl border border-nature-200/40">
                <h4 className="font-extrabold text-nature-700 dark:text-nature-400 text-[10px] uppercase mb-1">
                  Primary Crop Advisory Recommendation
                </h4>
                <p className="text-sm font-bold text-gray-850 dark:text-zinc-200 leading-relaxed">
                  {aiResponse.recommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50/50 dark:bg-zinc-850 p-4 rounded-xl border border-gray-150/40 space-y-1.5">
                  <h4 className="font-extrabold text-gray-450 text-[10px] uppercase">
                    AI Rationale Explanation
                  </h4>
                  <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {aiResponse.why}
                  </p>
                </div>

                <div className="bg-gray-50/50 dark:bg-zinc-850 p-4 rounded-xl border border-gray-150/40 space-y-3">
                  <h4 className="font-extrabold text-gray-450 text-[10px] uppercase">
                    7-Day Mitigations Action timeline
                  </h4>
                  <div className="space-y-2.5 font-bold">
                    {aiResponse.action_plan.slice(0, 3).map((act: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start text-[11px]">
                        <span className="bg-nature-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black mt-0.5">
                          Day {act.day}
                        </span>
                        <span className="text-gray-700 dark:text-zinc-350 leading-relaxed">{act.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
