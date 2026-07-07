import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, RefreshCw, AlertTriangle, ArrowRight, Download, Loader2, CheckCircle2 } from 'lucide-react';
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

  // Server-side TTS state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'generating' | 'playing' | 'complete' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    stopAudio();

    recognition.onstart = () => setRecognizing(true);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setRecognizing(false);
    };
    recognition.onend = () => setRecognizing(false);
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
      setAudioUrl(null);
      setAudioError('');
      setAudioStatus('idle');
      const res = await api.sendGeminiMessage({ message: queryText, language: lang });
      setAiResponse(res);

      // Auto-generate server TTS if speech is enabled
      if (speechEnabled) {
        await generateAndPlayAudio(res);
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

  const generateAndPlayAudio = async (res: any) => {
    const text = getSpeakableText(res);
    if (!text.trim()) return;

    try {
      setGeneratingAudio(true);
      setAudioStatus('generating');
      setAudioError('');

      console.log("=== SERVER TTS AUDIT ===");
      console.log("Language:", lang);
      console.log("Text length:", text.length);

      const ttsResponse = await api.generateTTSAudio({ text, language: lang });
      const fullAudioUrl = api.getTTSAudioUrl(ttsResponse.audio_url);
      setAudioUrl(fullAudioUrl);

      console.log("Audio URL:", fullAudioUrl);
      console.log("Cached:", ttsResponse.cached);

      // Auto-play the generated audio
      playAudioFromUrl(fullAudioUrl);
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setAudioError(err.message || "Failed to generate audio.");
      setAudioStatus('error');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const playAudioFromUrl = (url: string) => {
    stopAudio();

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => {
      setSpeaking(true);
      setAudioStatus('playing');
    };

    audio.onended = () => {
      setSpeaking(false);
      setAudioStatus('complete');
    };

    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setSpeaking(false);
      setAudioError("Audio playback failed.");
      setAudioStatus('error');
    };

    audio.play().catch((err) => {
      console.warn("Auto-play blocked by browser:", err);
      setSpeaking(false);
      setAudioStatus('idle');
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
    setAudioStatus('idle');
  };

  const handlePlayButton = async () => {
    if (speaking) {
      stopAudio();
      return;
    }

    if (audioUrl) {
      // Replay cached audio
      playAudioFromUrl(audioUrl);
    } else if (aiResponse) {
      // Generate fresh audio
      await generateAndPlayAudio(aiResponse);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getLangLabel = () => {
    switch (lang) {
      case 'hi': return 'Hindi';
      case 'ml': return 'Malayalam';
      case 'te': return 'Telugu';
      default: return 'English';
    }
  };

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
              KisanVriddhi Voice Advisory
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

              <div className="flex gap-2 items-center">
                {generatingAudio ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl text-[11px] font-extrabold">
                    <Loader2 size={14} className="animate-spin" /> Generating Audio...
                  </div>
                ) : speaking ? (
                  <button
                    onClick={stopAudio}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200/50 rounded-xl text-[11px] font-extrabold transition animate-pulse"
                  >
                    <VolumeX size={14} /> Stop Playback
                  </button>
                ) : (
                  <button
                    onClick={handlePlayButton}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-nature-50 text-nature-600 hover:bg-nature-100 border border-nature-200/50 rounded-xl text-[11px] font-extrabold transition"
                  >
                    <Volume2 size={14} /> Play Speech Readout
                  </button>
                )}

                {audioUrl && (
                  <a
                    href={audioUrl}
                    download
                    className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-150/50 rounded-xl text-[11px] font-extrabold transition"
                    title="Download MP3"
                  >
                    <Download size={13} />
                  </a>
                )}
              </div>
            </div>

            {/* Audio Status Banner */}
            {audioStatus !== 'idle' && (
              <div className={`rounded-xl p-3.5 flex items-center justify-between border ${
                audioStatus === 'generating' ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/20' :
                audioStatus === 'playing' ? 'bg-nature-50/30 dark:bg-nature-950/15 border-nature-200/20' :
                audioStatus === 'complete' ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/20' :
                'bg-red-50/30 dark:bg-red-950/10 border-red-200/20'
              }`}>
                <span className="text-[11px] font-bold flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      audioStatus === 'generating' ? 'bg-amber-500' :
                      audioStatus === 'playing' ? 'bg-nature-500' :
                      audioStatus === 'complete' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      audioStatus === 'generating' ? 'bg-amber-600' :
                      audioStatus === 'playing' ? 'bg-nature-600' :
                      audioStatus === 'complete' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}></span>
                  </span>
                  <span className={
                    audioStatus === 'generating' ? 'text-amber-700 dark:text-amber-400' :
                    audioStatus === 'playing' ? 'text-nature-700 dark:text-nature-400' :
                    audioStatus === 'complete' ? 'text-emerald-700 dark:text-emerald-400' :
                    'text-red-700 dark:text-red-400'
                  }>
                    {audioStatus === 'generating' && 'Generating Audio...'}
                    {audioStatus === 'playing' && 'Playing Audio...'}
                    {audioStatus === 'complete' && 'Playback Complete'}
                    {audioStatus === 'error' && 'Playback Error'}
                  </span>
                </span>
                <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400">
                  {audioStatus === 'generating' ? 'Server-side TTS (gTTS)' :
                   audioStatus === 'playing' ? `${getLangLabel()} • MP3 Audio` :
                   audioStatus === 'complete' ? 'Ready to replay' :
                   audioError}
                </span>
              </div>
            )}

            {audioError && audioStatus === 'error' && (
              <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200/30 p-3 rounded-lg text-red-650 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[11px]">{audioError}</p>
                  <p className="text-[9px] text-gray-450 leading-relaxed font-semibold mt-0.5">
                    Please check your internet connection and try again.
                  </p>
                </div>
              </div>
            )}

            {/* Server TTS Info Panel */}
            <div className="bg-gray-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-gray-150/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-bold">
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-150/40">
                  <span className="text-[9px] text-gray-400 block uppercase">TTS Engine</span>
                  <span className="text-gray-800 dark:text-zinc-200">Server (gTTS)</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-150/40">
                  <span className="text-[9px] text-gray-400 block uppercase">Language</span>
                  <span className="text-gray-800 dark:text-zinc-200">{getLangLabel()}</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-150/40">
                  <span className="text-[9px] text-gray-400 block uppercase">Format</span>
                  <span className="text-gray-800 dark:text-zinc-200">MP3 Audio</span>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-150/40">
                  <span className="text-[9px] text-gray-400 block uppercase">Compatibility</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> All Devices
                  </span>
                </div>
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
                    7-Day Mitigations Action Timeline
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
