import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Play, Square, Bot, PhoneCall, CheckCircle2, Clock, MessageCircle, X, ChevronDown } from 'lucide-react';

interface AssistantChatProps {
  lang: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  voiceUrl?: string;
}

interface OfficerReply {
  id: number;
  message: string;
  status: string;
  officer_reply?: string;
  replied_by?: string;
  created_at: string;
  replied_at?: string;
}

const WELCOME: Record<string, string> = {
  en: "Welcome to **KisanVriddhi** — Empowering Farmers Through Intelligence! I can help with crop advice, weather alerts, and disease queries. If I can't resolve your issue, use **Contact Officer** below.",
  hi: "**KisanVriddhi** में आपका स्वागत है — किसानों को बुद्धिमत्ता से सशक्त बनाना! फसल सलाह, मौसम अलर्ट या रोग की जानकारी के लिए पूछें। यदि मैं समाधान नहीं दे पाऊं तो नीचे **अधिकारी से संपर्क करें** पर क्लिक करें।",
  ml: "**KisanVriddhi** ലേക്ക് സ്വാഗതം — കർഷകരെ ബുദ്ധിവൈഭവത്തിലൂടെ ശക്തിപ്പെടുത്തുന്നു! വിള ഉപദേശം, കാലാവസ്ഥ, രോഗ നിർണ്ണയം എന്നിവ ചോദിക്കൂ. പ്രശ്നം പരിഹരിക്കാൻ കഴിയാത്ത പക്ഷം **ഓഫീസറെ ബന്ധപ്പെടുക** ഉപയോഗിക്കൂ.",
  te: "**KisanVriddhi** కు స్వాగతం — రైతులను మేధస్సుతో శక్తివంతం చేయడం! పంట సలహా, వాతావరణ హెచ్చరికలు, వ్యాధి నిర్ధారణ అడగండి. సమాధానం లభించకపోతే **అధికారిని సంప్రదించండి** నొక్కండి.",
};

const QUICK_PROMPTS: Record<string, string[]> = {
  en: ["Will it rain tomorrow?", "My crop leaves are yellowing", "How much fertilizer for wheat?", "Dry spell alert in my area?"],
  hi: ["कल बारिश होगी?", "फसल के पत्ते पीले हो रहे हैं", "गेहूं के लिए कितना यूरिया?", "मेरे क्षेत्र में सूखे का अलर्ट?"],
  ml: ["നാളെ മഴ പെയ്യുമോ?", "ഇലകൾ മഞ്ഞനിറമാകുന്നു", "ഗോതമ്പിന് എത്ര വളം?", "സ്ഥലത്ത് വരൾച്ച അലേർട്ട്?"],
  te: ["రేపు వర్షం పడుతుందా?", "పంట ఆకులు పసుపు రంగులోకి మారుతున్నాయి", "గోధుమకు ఎంత ఎరువు?", "మా ప్రాంతంలో కరువు హెచ్చరిక?"],
};

export const AssistantChat: React.FC<AssistantChatProps> = ({ lang }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'assistant', text: WELCOME[lang] || WELCOME.en }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);

  // Contact Officer modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [officerMsg, setOfficerMsg] = useState('');
  const [sendingToOfficer, setSendingToOfficer] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Officer replies panel
  const [showReplies, setShowReplies] = useState(false);
  const [officerReplies, setOfficerReplies] = useState<OfficerReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      if (history.length > 0) {
        const formatted = history.map((item: any) => {
          const isUser = item.description.startsWith('[USER]');
          const cleanText = item.description.replace(/^\[USER\]\s*|^\[ASSISTANT\]\s*/, '');
          return { id: item.id.toString(), sender: isUser ? 'user' : 'assistant', text: cleanText };
        });
        setMessages([{ id: 'welcome', sender: 'assistant', text: WELCOME[lang] || WELCOME.en }, ...formatted]);
      }
    } catch { /* ignore */ }
  };

  const loadOfficerReplies = async () => {
    setLoadingReplies(true);
    try {
      const replies = await api.getMyOfficerReplies();
      setOfficerReplies(replies || []);
      const replied = (replies || []).filter((r: OfficerReply) => r.status === 'replied').length;
      setUnreadCount(replied);
    } catch { /* ignore */ }
    setLoadingReplies(false);
  };

  useEffect(() => {
    loadHistory();
    loadOfficerReplies();
  }, [lang]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const queryText = customMsg || input;
    if (!queryText.trim()) return;

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: queryText }]);
    setInput('');
    setSending(true);

    try {
      const response = await api.sendMessage({ message: queryText });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.response,
        voiceUrl: response.voice_response_url
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: err.message || 'Service temporarily offline. Please try the Contact Officer option below.'
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceInput = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      const mockQueries = [
        "Will it rain tomorrow in my village?",
        "My cotton leaves are turning yellow and curling up",
        "How much urea should I apply for wheat crop?",
        "Is there a dry spell alert for this district?"
      ];
      handleSend(undefined, mockQueries[Math.floor(Math.random() * mockQueries.length)]);
    }, 2000);
  };

  const handleTTSRead = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
      utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleContactOfficer = async () => {
    if (!officerMsg.trim()) return;
    setSendingToOfficer(true);
    try {
      await api.contactOfficer(officerMsg);
      setContactSuccess(true);
      setOfficerMsg('');
      setTimeout(() => {
        setContactSuccess(false);
        setShowContactModal(false);
        loadOfficerReplies();
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to send. Please try again.');
    }
    setSendingToOfficer(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      replied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
    };
    return map[status] || map.open;
  };

  const prompts = QUICK_PROMPTS[lang] || QUICK_PROMPTS.en;

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium h-[78vh] overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-nature-600 p-4 text-white flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-nature-800 rounded-xl">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide">{getTranslation('assistant', lang)}</h3>
            <span className="text-[10px] text-nature-100 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
              Expert Advisory Engine • Active
            </span>
          </div>
        </div>
        {/* Officer replies bell */}
        <button
          onClick={() => { setShowReplies(!showReplies); loadOfficerReplies(); }}
          className="relative p-2 bg-nature-700 hover:bg-nature-800 rounded-xl transition"
          title="Officer Replies"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Officer Replies Panel (collapsible) ── */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-gray-100 dark:border-zinc-800 bg-amber-50/60 dark:bg-amber-900/10 shrink-0"
          >
            <div className="p-3 max-h-48 overflow-y-auto space-y-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5" /> Officer Replies
                </p>
                <button onClick={() => setShowReplies(false)}>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              {loadingReplies ? (
                <p className="text-xs text-gray-400 animate-pulse">Loading...</p>
              ) : officerReplies.length === 0 ? (
                <p className="text-xs text-gray-400">No messages sent to officers yet.</p>
              ) : officerReplies.map(r => (
                <div key={r.id} className="bg-white dark:bg-zinc-800 rounded-xl p-3 border border-gray-100 dark:border-zinc-700 text-xs">
                  <div className="flex justify-between mb-1">
                    <p className="font-bold text-gray-700 dark:text-zinc-200 truncate">{r.message}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ml-2 shrink-0 ${statusBadge(r.status)}`}>{r.status}</span>
                  </div>
                  {r.officer_reply && (
                    <div className="mt-2 bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border-l-2 border-green-400">
                      <p className="text-green-700 dark:text-green-400 font-bold text-[10px] mb-0.5">
                        ✅ Officer Reply {r.replied_by ? `(${r.replied_by})` : ''}:
                      </p>
                      <p className="text-gray-700 dark:text-zinc-300">{r.officer_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Prompts ── */}
      <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(undefined, p)}
            disabled={sending}
            className="shrink-0 px-3 py-1.5 bg-nature-50 dark:bg-nature-900/30 border border-nature-200 dark:border-nature-700 text-nature-700 dark:text-nature-300 text-[10px] font-semibold rounded-full hover:bg-nature-100 dark:hover:bg-nature-800/40 transition whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-zinc-900/30">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`p-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-line shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-nature-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50 text-gray-800 dark:text-zinc-200 rounded-tl-sm'
              }`}>
                {msg.text}
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleTTSRead(msg.text)}
                    className="mt-2 flex items-center gap-1 text-[9px] font-bold text-nature-600 dark:text-nature-400 hover:underline"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Hear Voice Advisory
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex items-center gap-2 max-w-[80%] text-xs text-gray-400 font-medium">
            <Bot className="h-5 w-5 text-gray-400" />
            <span className="animate-pulse">Searching knowledge base...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Contact Officer Banner ── */}
      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20 shrink-0">
        <button
          onClick={() => setShowContactModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <PhoneCall className="h-4 w-4" />
          {lang === 'hi' ? 'अधिकारी से संपर्क करें' :
           lang === 'ml' ? 'ഓഫീസറെ ബന്ധപ്പെടുക' :
           lang === 'te' ? 'అధికారిని సంప్రదించండి' :
           'Contact Officer Directly'}
        </button>
      </div>

      {/* ── Input Form ── */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-50 dark:border-zinc-800 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={recording || sending}
          className={`p-3 rounded-xl border border-gray-150 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition ${
            recording ? 'bg-red-50 text-red-500 border-red-500 animate-pulse' : 'text-gray-400 dark:text-zinc-300'
          }`}
        >
          {recording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />}
        </button>

        <input
          type="text"
          placeholder={recording ? "Listening... Speak now..." : getTranslation('chatPrompt', lang)}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={recording || sending}
          className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700/80 rounded-xl px-4 py-3 text-xs text-gray-800 dark:text-zinc-200"
        />

        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-3 bg-nature-600 hover:bg-nature-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* ── Contact Officer Modal ── */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  <div>
                    <h3 className="font-extrabold text-sm">
                      {lang === 'hi' ? 'अधिकारी से सीधा संपर्क' :
                       lang === 'ml' ? 'ഓഫീസറെ നേരിട്ട് ബന്ധപ്പെടുക' :
                       lang === 'te' ? 'అధికారిని నేరుగా సంప్రదించండి' :
                       'Contact Agricultural Officer'}
                    </h3>
                    <p className="text-[10px] text-amber-100">Your message will be reviewed within 24 hours</p>
                  </div>
                </div>
                <button onClick={() => setShowContactModal(false)} className="hover:bg-amber-600 p-1 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5">
                {contactSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6"
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
                    <h4 className="font-extrabold text-gray-800 dark:text-zinc-100 text-base mb-1">Message Sent!</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">An agricultural officer will respond to your query. Check the replies panel in the chat header.</p>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mb-3 leading-relaxed">
                      {lang === 'hi' ? 'अपनी फसल की समस्या, रोग के लक्षण या किसी भी कृषि समस्या का विवरण यहाँ लिखें। अधिकारी आपकी मदद करेंगे।' :
                       lang === 'ml' ? 'നിങ്ങളുടെ വിള പ്രശ്നം, രോഗ ലക്ഷണങ്ങൾ, അല്ലെങ്കിൽ ഏതൊരു കാർഷിക ആശങ്കയും ഇവിടെ വിശദമാക്കുക.' :
                       lang === 'te' ? 'మీ పంట సమస్య, వ్యాధి లక్షణాలు లేదా ఏదైనా వ్యవసాయ సమస్యను వివరించండి. అధికారి మీకు సహాయం చేస్తారు.' :
                       'Describe your crop problem, disease symptoms, or any farming concern. An officer will review and respond.'}
                    </p>
                    <textarea
                      value={officerMsg}
                      onChange={e => setOfficerMsg(e.target.value)}
                      placeholder={
                        lang === 'hi' ? 'उदाहरण: मेरी गेहूं की फसल पर पत्तियों पर भूरे धब्बे हैं...' :
                        lang === 'ml' ? 'ഉദാ: എന്റെ നെൽ ചെടിയുടെ ഇലകളിൽ തവിട്ടു നിറത്തിലുള്ള പൊട്ടുകൾ കാണുന്നു...' :
                        lang === 'te' ? 'ఉదా: నా గోధుమ పంటలో ఆకులపై గోధుమ రంగు మచ్చలు కనిపిస్తున్నాయి...' :
                        'E.g: My wheat crop leaves have brown spots appearing since last 3 days...'
                      }
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-gray-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      Officer typically responds within 24 hours
                    </div>
                    <button
                      onClick={handleContactOfficer}
                      disabled={!officerMsg.trim() || sendingToOfficer}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingToOfficer ? (
                        <span className="animate-pulse">Sending...</span>
                      ) : (
                        <>
                          <PhoneCall className="h-4 w-4" />
                          {lang === 'hi' ? 'अधिकारी को संदेश भेजें' :
                           lang === 'ml' ? 'ഓഫീസർക്ക് സന്ദേശം അയക്കുക' :
                           lang === 'te' ? 'అధికారికి సందేశం పంపండి' :
                           'Send Message to Officer'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
