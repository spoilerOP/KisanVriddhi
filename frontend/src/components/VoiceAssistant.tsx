import React, { useState, useEffect, useRef } from 'react';
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

  // Queue state variables for TTS
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(-1);
  const [totalChunksCount, setTotalChunksCount] = useState<number>(0);
  const [speakingStatus, setSpeakingStatus] = useState<string>('idle'); // 'speaking', 'complete', 'idle'
  const [speakingProgress, setSpeakingProgress] = useState<string>('');
  const chunksRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

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
    stopSpeaking();
    
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
        speakText(getSpeakableText(res));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSpeakableText = (res: any): string => {
    if (!res) return "";
    let fullText = "";
    if (lang === 'hi') {
      fullText = `मुख्य सिफारिश: ${res.recommendation || ''}. ` +
                 `विवरण: ${res.why || ''}. ` +
                 (res.expected_benefits?.length ? `अपेक्षित लाभ: ${res.expected_benefits.join(". ")}. ` : "") +
                 (res.potential_risks?.length ? `संभावित जोखिम: ${res.potential_risks.join(". ")}. ` : "") +
                 (res.action_plan?.length ? `7 दिवसीय कार्य योजना: ` + res.action_plan.map((act: any) => `दिन ${act.day}: ${act.action}`).join(". ") : "");
    } else if (lang === 'ml') {
      fullText = `പ്രധാന ശുപാർശ: ${res.recommendation || ''}. ` +
                 `വിശദീകരണം: ${res.why || ''}. ` +
                 (res.expected_benefits?.length ? `പ്രതീക്ഷിക്കുന്ന ഗുണങ്ങൾ: ${res.expected_benefits.join(". ")}. ` : "") +
                 (res.potential_risks?.length ? `സാധ്യമായ അപകടങ്ങൾ: ${res.potential_risks.join(". ")}. ` : "") +
                 (res.action_plan?.length ? `7 ദിവസത്തെ കർമ്മ പദ്ധതി: ` + res.action_plan.map((act: any) => `ദിവസം ${act.day}: ${act.action}`).join(". ") : "");
    } else if (lang === 'te') {
      fullText = `ముఖ్యమైన సిఫార్సు: ${res.recommendation || ''}. ` +
                 `వివరణ: ${res.why || ''}. ` +
                 (res.expected_benefits?.length ? `ఆశించిన ప్రయోజనాలు: ${res.expected_benefits.join(". ")}. ` : "") +
                 (res.potential_risks?.length ? `సంభావ్య ప్రమాదాలు: ${res.potential_risks.join(". ")}. ` : "") +
                 (res.action_plan?.length ? `7 రోజుల కార్యాచరణ ప్రణాళిక: ` + res.action_plan.map((act: any) => `రోజు ${act.day}: ${act.action}`).join(". ") : "");
    } else {
      fullText = `Primary Recommendation: ${res.recommendation || ''}. ` +
                 `Rationale: ${res.why || ''}. ` +
                 (res.expected_benefits?.length ? `Expected Benefits: ${res.expected_benefits.join(". ")}. ` : "") +
                 (res.potential_risks?.length ? `Potential Risks: ${res.potential_risks.join(". ")}. ` : "") +
                 (res.action_plan?.length ? `7-Day Mitigation Action Timeline: ` + res.action_plan.map((act: any) => `Day ${act.day}: ${act.action}`).join(". ") : "");
    }
    return fullText;
  };

  const splitTextIntoChunks = (text: string): string[] => {
    // Split sentences using punctuation boundaries across scripts (. ? ! ।)
    const sentenceRegex = /[^.!?।]+[.!?।]+/g;
    const matches = text.match(sentenceRegex);
    
    if (!matches) {
      // Chunk by fixed sizes if no punctuation matches
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, 160));
        remaining = remaining.substring(160);
      }
      return chunks.filter(c => c.trim().length > 0);
    }
    
    const chunks: string[] = [];
    let currentChunk = "";
    for (const sentence of matches) {
      if ((currentChunk + sentence).length > 170) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = true;
      
      const cleanText = text.replace(/\*\*/g, '').replace(/[\#\*\_]/g, ' ');
      const chunks = splitTextIntoChunks(cleanText);
      chunksRef.current = chunks;
      
      console.log("=== TTS AUDIT LOG ===");
      console.log(`Total advisory character count: ${cleanText.length}`);
      console.log(`Number of speech chunks: ${chunks.length}`);
      console.log("Speech chunks payload:", chunks);

      if (chunks.length === 0) {
        setSpeakingStatus('complete');
        setSpeakingProgress('Speech Complete');
        setSpeaking(false);
        isSpeakingRef.current = false;
        return;
      }

      setSpeakingStatus('speaking');
      setSpeaking(true);
      setTotalChunksCount(chunks.length);
      
      // Start speaking first chunk
      speakChunk(0);
    }
  };

  const speakChunk = (index: number) => {
    if (!isSpeakingRef.current) return;
    
    if (index >= chunksRef.current.length) {
      console.log("=== TTS AUDIT LOG ===");
      console.log("Speech completion status: SUCCESS (All chunks completed)");
      setSpeakingStatus('complete');
      setSpeakingProgress('Speech Complete');
      setSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    const chunkText = chunksRef.current[index];
    console.log(`Current chunk being spoken: ${index + 1} of ${chunksRef.current.length}`);
    console.log(`Chunk text: "${chunkText}"`);
    
    setSpeakingProgress(`Speaking chunk ${index + 1} of ${chunksRef.current.length}...`);
    setCurrentChunkIndex(index);

    const utterance = new SpeechSynthesisUtterance(chunkText);
    const targetLang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-IN';
    
    // Find optimal voice matching target language
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
    if (optimalVoice) {
      utterance.voice = optimalVoice;
      console.log(`Optimal local voice selected: ${optimalVoice.name}`);
    }

    utterance.lang = targetLang;
    utterance.rate = 0.90; // Natural pacing
    utterance.pitch = 1.0;

    utterance.onend = () => {
      speakChunk(index + 1);
    };

    utterance.onerror = (e) => {
      console.warn(`SpeechSynthesis error on chunk index ${index}:`, e);
      speakChunk(index + 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      chunksRef.current = [];
      setSpeaking(false);
      setSpeakingStatus('idle');
      setSpeakingProgress('');
    }
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

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
                    onClick={() => speakText(getSpeakableText(aiResponse))}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-nature-50 text-nature-600 hover:bg-nature-100 border border-nature-200/50 rounded-xl text-[11px] font-extrabold transition"
                  >
                    <Volume2 size={14} /> Play Speech Readout
                  </button>
                )}
              </div>
            </div>

            {speakingProgress && (
              <div className="bg-nature-50/30 dark:bg-nature-950/15 border border-nature-200/20 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-nature-700 dark:text-nature-400 flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${speakingStatus === 'speaking' ? 'bg-nature-500' : 'bg-emerald-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${speakingStatus === 'speaking' ? 'bg-nature-600' : 'bg-emerald-600'}`}></span>
                  </span>
                  {speakingStatus === 'speaking' ? 'Speaking Readout...' : 'Readout Complete'}
                </span>
                <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400">
                  {speakingProgress}
                </span>
              </div>
            )}

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
