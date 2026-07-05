import React, { useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Sprout, Award, ClipboardList, TrendingUp, AlertTriangle, ShieldCheck 
} from 'lucide-react';

interface CropRecommenderProps {
  lang: string;
}

export const CropRecommender: React.FC<CropRecommenderProps> = ({ lang }) => {
  const [form, setForm] = useState({
    soil_type: 'Clayey',
    soil_ph: 6.5,
    land_size: 2.5,
    season: 'Kharif'
  });

  const [result, setResult] = useState<any>(null);
  const [activeCropIndex, setActiveCropIndex] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const recommendRes = await api.getCropRecommendation(form);
      const comparisonRes = await api.getCropComparisonList(form.soil_type, form.soil_ph, form.season);
      
      setResult(recommendRes);
      setActiveCropIndex(0);
      
      // Map confidence suitability list to percentages (0 to 100)
      setChartData(
        comparisonRes.map((item: any) => ({
          crop: item.crop,
          confidence: Math.round(item.confidence)
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate crop recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#488b4d', '#36703b', '#2c5930', '#82ca9d', '#a4de6c'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
        <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-4">
          <Sprout className="h-5.5 w-5.5 text-nature-600" />
          {getTranslation('recommendation', lang)} Engine
        </h2>
        
        <form onSubmit={handleRecommend} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Soil Type
            </label>
            <select
              value={form.soil_type}
              onChange={e => setForm({ ...form, soil_type: e.target.value })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200 font-medium"
            >
              <option value="Clayey">Clayey (चिकनी मिट्टी)</option>
              <option value="Alluvial">Alluvial (जलोढ़)</option>
              <option value="Black">Black (काली मिट्टी)</option>
              <option value="Sandy">Sandy (रेतीली मिट्टी)</option>
              <option value="Loamy">Loamy (दोमट)</option>
              <option value="Red">Red (लाल मिट्टी)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Soil pH ({form.soil_ph})
            </label>
            <input 
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={form.soil_ph}
              onChange={e => setForm({ ...form, soil_ph: parseFloat(e.target.value) || 7.0 })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Season
            </label>
            <select
              value={form.season}
              onChange={e => setForm({ ...form, season: e.target.value })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200 font-medium"
            >
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Advice'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Top 3 Tabs */}
          {Array.isArray(result) && result.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {result.map((cropRes: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCropIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shrink-0 ${
                    activeCropIndex === idx
                      ? 'bg-nature-600 text-white border-nature-600 shadow-premium'
                      : 'bg-white dark:bg-zinc-900 text-gray-500 border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  Rank #{idx + 1}: {cropRes.recommended_crop} ({Math.round(cropRes.confidence_score * 105)}%)
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Primary Recommendation Card */}
              {(() => {
                const activeResult = Array.isArray(result) ? result[activeCropIndex] : result;
                if (!activeResult) return null;

                return (
                  <>
                    <div className="bg-gradient-to-br from-nature-500/10 to-nature-600/5 dark:from-nature-950/20 dark:to-zinc-900 border border-nature-500/20 rounded-2xl p-6 shadow-premium relative overflow-hidden">
                      <div className="absolute right-0 top-0 bg-nature-600 text-white text-xs font-bold px-4 py-2 rounded-bl-xl flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Rank #{activeCropIndex + 1} Fit
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-nature-600 text-white rounded-2xl">
                          <Sprout className="h-8 w-8" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-nature-600 tracking-wider">
                            {getTranslation('recommendation', lang)}
                          </span>
                          <h3 className="text-2xl font-extrabold text-gray-800 dark:text-zinc-200 mt-0.5">
                            {activeResult.recommended_crop}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/80 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/50">
                          <span className="text-xs text-gray-400">{getTranslation('confidence', lang)}</span>
                          <p className="text-xl font-black text-nature-600 dark:text-nature-400 mt-1">
                            {Math.round(activeResult.confidence_score * 105)}%
                          </p>
                        </div>
                        <div className="bg-white/80 dark:bg-zinc-800/40 p-4 rounded-xl border border-gray-100 dark:border-zinc-800/50">
                          <span className="text-xs text-gray-400">{getTranslation('yield', lang)}</span>
                          <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">
                            {activeResult.yield_potential}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reasons Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
                      <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-zinc-800/50 pb-2">
                        <ClipboardList className="h-4.5 w-4.5 text-nature-600" />
                        {getTranslation('reasons', lang)}
                      </h4>
                      <ul className="space-y-3">
                        {activeResult.reasons.map((reason: string, idx: number) => (
                          <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-700 dark:text-zinc-300">
                            <ShieldCheck className="h-4.5 w-4.5 text-green-600 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
                      <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-zinc-800/50 pb-2">
                        <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                        {getTranslation('risks', lang)}
                      </h4>
                      <ul className="space-y-3">
                        {activeResult.risk_factors.map((risk: string, idx: number) => (
                          <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-700 dark:text-zinc-300">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-2"></div>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </motion.div>

          {/* Chart Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium h-fit"
          >
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm flex items-center gap-2 mb-6">
              <TrendingUp className="h-4.5 w-4.5 text-nature-600" />
              Confidence Comparison (%)
            </h4>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#888888" fontSize={10} />
                  <YAxis dataKey="crop" type="category" stroke="#888888" fontSize={9} width={75} />
                  <Tooltip cursor={{ fill: 'rgba(72,139,77,0.05)' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="confidence" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-4 text-center">
              The chart compares suitability percentages for alternative crops calculated against the farm's soil specifications.
            </p>
          </motion.div>
        </div>
      </div>
      )}
    </div>
  );
};
