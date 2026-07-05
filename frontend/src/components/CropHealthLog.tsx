import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Mic, FileText, AlertCircle, HelpCircle, 
  Send, CheckCircle, RefreshCw, PhoneCall, ListFilter 
} from 'lucide-react';

interface CropHealthLogProps {
  lang: string;
}

export const CropHealthLog: React.FC<CropHealthLogProps> = ({ lang }) => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Diagnosis states
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [diagnosing, setDiagnosing] = useState(false);
  
  // Case Referral States
  const [referring, setReferring] = useState(false);
  const [referredCase, setReferredCase] = useState<any>(null);
  
  // History states
  const [logs, setLogs] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [historyTab, setHistoryTab] = useState<'logs' | 'cases'>('cases');

  const fetchHistory = async () => {
    try {
      const caseRes = await api.getMyCases();
      setCases(caseRes);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate Voice Recording
  const triggerVoiceRecord = () => {
    setVoiceRecorded(true);
    // Create a mock audio blob file
    const mockBlob = new Blob(["mock-audio"], { type: "audio/wav" });
    const file = new File([mockBlob], "voice_symptoms.wav", { type: "audio/wav" });
    setVoiceFile(file);
  };

  const handleLogUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !imageFile && !voiceFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (voiceFile) {
        formData.append('voice', voiceFile);
      }

      await api.uploadCropLog(formData);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setVoiceFile(null);
      setVoiceRecorded(false);
      
      // Refresh case listings
      fetchHistory();
      
      // Auto trigger diagnosis on upload if an image was present
      if (imageFile) {
        handleDiagnosis([]);
      }
    } catch (err: any) {
      alert(err.message || 'Log upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDiagnosis = async (explicitSymptoms: string[] = []) => {
    try {
      setDiagnosing(true);
      setReferredCase(null);
      
      // Map current question answers to structure required by backend
      const answerPayload = Object.entries(answers).map(([key, val]) => ({
        question_key: key,
        answer: val
      }));

      // Parse symptoms list based on what the client has marked
      const response = await api.diagnoseDisease({
        description: description,
        symptoms: explicitSymptoms.length ? explicitSymptoms : symptoms,
        answers: answerPayload
      });
      
      setDiagnosis(response);
      setSymptoms(response.symptoms_detected);
      
      if (response.referred_to_expert && response.case_id) {
        setReferredCase({ case_id: response.case_id });
        fetchHistory();
      }
    } catch (err: any) {
      alert(err.message || 'Diagnosis failed');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleAnswerChange = (key: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  // Recalculate diagnosis after user updates follow-up questions
  const handleRecalculate = () => {
    // Keep currently detected symptoms and submit with answered keys
    handleDiagnosis();
  };

  const handleManualRefer = async () => {
    if (!diagnosis) return;
    try {
      setReferring(true);
      const res = await api.referCase({
        disease_name: diagnosis.disease_name,
        confidence: diagnosis.confidence.toString(),
        symptoms: symptoms.join(','),
        treatment: diagnosis.treatment_recommendation
      });
      setReferredCase(res);
      setDiagnosis(prev => ({ ...prev, referred_to_expert: true, case_id: res.case_id }));
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Referral failed');
    } finally {
      setReferring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Logger / Form Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
          <h3 className="text-md font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-nature-600" />
            File Crop Health Record
          </h3>

          <form onSubmit={handleLogUpload} className="space-y-4">
            {/* Description Text */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Describe Crop Condition / Symptoms
              </label>
              <textarea 
                rows={3}
                placeholder="e.g. Rice leaves are curling and showing tiny spots..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs input-glow text-gray-800 dark:text-zinc-200"
              />
            </div>

            {/* Media Uploads */}
            <div className="grid grid-cols-2 gap-3">
              {/* Image Input */}
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-picker"
                />
                <label 
                  htmlFor="image-picker"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-nature-500 rounded-xl p-4 cursor-pointer text-center h-28 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition"
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Crop upload preview" 
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold mt-2">Add Image</span>
                    </>
                  )}
                </label>
              </div>

              {/* Speech Input */}
              <button 
                type="button"
                onClick={triggerVoiceRecord}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer text-center h-28 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition ${
                  voiceRecorded ? 'border-nature-500 bg-nature-50/20' : 'border-gray-200 dark:border-zinc-800'
                }`}
              >
                <Mic className={`h-5 w-5 ${voiceRecorded ? 'text-nature-600 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-[10px] text-gray-400 font-bold mt-2">
                  {voiceRecorded ? 'Voice Recorded' : 'Record Voice'}
                </span>
              </button>
            </div>

            <button 
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Upload & Analyze Crop'}
            </button>
          </form>
        </div>

        {/* Diagnostic Tickets History */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
              <ListFilter className="h-4.5 w-4.5 text-nature-600" />
              Ticket History
            </h4>
            <span className="text-[10px] font-bold text-gray-400">
              {cases.length} Filed
            </span>
          </div>

          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {cases.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">No reports filed yet.</div>
            ) : (
              cases.map((c: any) => (
                <div key={c.case_id} className="p-3 border border-gray-50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-sm rounded-xl space-y-2 text-xs transition hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-zinc-200">{c.disease_name}</span>
                    <div className="flex items-center gap-1.5">
                      {c.priority && (
                        <span className={`px-1.5 py-0.5 font-extrabold rounded text-[8px] tracking-wide ${
                          c.priority === 'Critical' 
                            ? 'bg-red-50 text-red-600 border border-red-200/50' 
                            : c.priority === 'High' 
                              ? 'bg-orange-50 text-orange-600 border border-orange-200/50' 
                              : 'bg-blue-50 text-blue-600 border border-blue-200/50'
                        }`}>
                          {c.priority}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 font-bold rounded-full text-[9px] ${
                        c.status === 'resolved' 
                          ? 'text-green-600 bg-green-50 dark:bg-green-950/20' 
                          : c.status === 'in_progress' 
                            ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' 
                            : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">ID: {c.case_id} • Suitability: {Math.round(c.confidence*100)}%</p>
                  {c.officer_remarks && (
                    <div className="bg-purple-50/50 dark:bg-purple-950/10 p-2 rounded-lg border border-purple-100 dark:border-purple-900/20 text-[10px]">
                      <span className="font-bold text-purple-700">Remarks: </span>
                      <span className="text-gray-600 dark:text-zinc-300">{c.officer_remarks}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis / Expert System Section */}
      <div className="lg:col-span-2 space-y-6">
        <AnimatePresence mode="wait">
          {diagnosing ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-8 text-center shadow-premium flex flex-col items-center justify-center min-h-[40vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
              <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-zinc-400">
                Running Vision Model & Symptoms Extraction Engine...
              </p>
            </div>
          ) : diagnosis ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Diagnosis Details Card */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
                <div className="border-b border-gray-50 dark:border-zinc-800/50 pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-nature-600 tracking-wider">
                    {getTranslation('diagnoseTitle', lang)}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
                    <h3 className="text-xl font-black text-gray-800 dark:text-zinc-200">
                      {diagnosis.disease_name}
                    </h3>
                    <span className="text-xs font-bold text-nature-600 bg-nature-50 dark:bg-nature-950/20 px-2 py-0.5 rounded">
                      {Math.round(diagnosis.confidence * 100)}% Confidence
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Symptoms Detected */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {getTranslation('symptoms', lang)}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {symptoms.map((sym: string) => (
                        <span 
                          key={sym}
                          className="text-[10px] font-semibold text-gray-600 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50 px-2.5 py-1 rounded-lg"
                        >
                          {sym.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Treatment Recommended */}
                  <div className="bg-nature-50/50 dark:bg-nature-950/10 p-4 rounded-xl border border-nature-100 dark:border-nature-900/20">
                    <h4 className="text-xs font-bold text-nature-700 dark:text-nature-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {getTranslation('treatment', lang)}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                      {diagnosis.treatment_recommendation}
                    </p>
                  </div>

                  {/* Diagnostic Explanation / Reasoning */}
                  {diagnosis.reasoning && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0 animate-pulse" />
                        Diagnostic Explanation
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                        {diagnosis.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expert System Follow-up Questions */}
              {diagnosis.follow_up_questions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium"
                >
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-4">
                    <HelpCircle className="h-4.5 w-4.5 text-nature-600 animate-bounce" />
                    Expert Diagnosis Check: Answer Follow-up Questions
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Help calibrate prediction. Do you notice any of these additional symptoms?
                  </p>

                  <div className="space-y-4 mb-6">
                    {diagnosis.follow_up_questions.map((q: any) => (
                      <div 
                        key={q.key} 
                        className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-800/40 border border-gray-50 dark:border-zinc-800/40 rounded-xl"
                      >
                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 pr-4">
                          {lang === 'hi' ? q.text_hi : lang === 'ml' ? q.text_ml : lang === 'te' ? q.text_te : q.text_en}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(q.key, true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              answers[q.key] === true 
                                ? 'bg-nature-600 text-white shadow-sm' 
                                : 'bg-white border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-gray-100'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(q.key, false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              answers[q.key] === false 
                                ? 'bg-red-600 text-white shadow-sm' 
                                : 'bg-white border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-gray-100'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleRecalculate}
                    className="w-full py-2.5 border border-nature-600 text-nature-600 dark:text-nature-400 hover:bg-nature-50/50 dark:hover:bg-nature-950/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Submit Answers & Recalculate
                  </button>
                </motion.div>
              )}

              {/* Expert Referral Status */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
                <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-2 mb-2">
                  <PhoneCall className="h-4.5 w-4.5 text-purple-600" />
                  Expert Referral Ticket
                </h4>
                
                {diagnosis.referred_to_expert ? (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Ticket successfully filed under Officer Queue
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">
                      Case ID: <span className="font-bold">{diagnosis.case_id || referredCase?.case_id}</span>. 
                      An Agricultural Officer will review the file symptoms and log remarks shortly.
                    </p>
                    {diagnosis.confidence < 0.70 && (
                      <div className="mt-2.5 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200/40 rounded-lg text-[10px] text-red-750 dark:text-red-400 font-extrabold flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        AI confidence was under 70% ({Math.round(diagnosis.confidence * 100)}%). Automated escalation triggered.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      AI diagnostic confidence is high, but if you notice that recommendations do not align with symptoms, you may manually refer this crop case to an officer directory.
                    </p>
                    <button 
                      onClick={handleManualRefer}
                      disabled={referring}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      {referring ? 'Creating Case...' : 'Request Expert Officer Review'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-8 text-center shadow-premium flex flex-col items-center justify-center min-h-[50vh]">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-md font-bold text-gray-800 dark:text-zinc-200">No active diagnosis report</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Upload crop logs containing leaf images or descriptions to run the symptom engine.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
