import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudSun, Thermometer, Droplet, Wind, AlertTriangle, CloudRain, ShieldCheck,
  Sun, Sunrise, Sunset, Eye, Sparkles, Zap, Bug, Waves, Flame, Loader2,
  CheckCircle2, ArrowRight, TrendingUp, Shield, CloudLightning, Snowflake,
  RefreshCw
} from 'lucide-react';
import { BadgesGroup } from './Badges';

interface WeatherCenterProps {
  lang: string;
}

export const WeatherCenter: React.FC<WeatherCenterProps> = ({ lang }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [impactData, setImpactData] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState('');

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getWeatherIntelligence();
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImpactAnalysis = async () => {
    try {
      setImpactLoading(true);
      setImpactError('');
      const data = await api.getWeatherImpactAnalysis();
      setImpactData(data);
    } catch (err: any) {
      setImpactError(err.message || 'Failed to generate impact analysis.');
    } finally {
      setImpactLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500">Loading Weather Intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
        <button onClick={fetchWeather} className="mt-4 px-4 py-2 bg-nature-600 text-white rounded-lg hover:bg-nature-700 transition text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/40', text: 'text-red-800 dark:text-red-400', icon: 'text-red-600', badge: '🔴 Critical', badgeClass: 'bg-red-100 text-red-800' };
      case 'high':
        return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/40', text: 'text-orange-800 dark:text-orange-400', icon: 'text-orange-600', badge: '🟠 High', badgeClass: 'bg-orange-100 text-orange-800' };
      case 'advisory':
        return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/40', text: 'text-amber-800 dark:text-amber-400', icon: 'text-amber-600', badge: '🟡 Advisory', badgeClass: 'bg-amber-100 text-amber-800' };
      case 'safe':
        return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900/40', text: 'text-green-800 dark:text-green-400', icon: 'text-green-600', badge: '🟢 Safe', badgeClass: 'bg-green-100 text-green-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500', badge: 'Info', badgeClass: 'bg-gray-100 text-gray-700' };
    }
  };

  const getFarmingStatusStyle = (status: string) => {
    switch (status) {
      case 'Good for Farming':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200';
      case 'Use Caution':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200';
      case 'High Risk':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200';
      case 'Low': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="h-5 w-5 text-amber-500" />;
    if (code <= 3) return <CloudSun className="h-5 w-5 text-sky-500" />;
    if (code >= 95) return <CloudLightning className="h-5 w-5 text-purple-600" />;
    if (code >= 71) return <Snowflake className="h-5 w-5 text-blue-400" />;
    if (code >= 51) return <CloudRain className="h-5 w-5 text-blue-600" />;
    return <CloudSun className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[date.getDay()], date: `${date.getDate()} ${months[date.getMonth()]}` };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ===== SECTION 1: HEADER ===== */}
      <div className="bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8">
          <CloudSun size={200} />
        </div>
        <div className="relative z-10 flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-bold">
                Weather Intelligence Center
              </span>
              <BadgesGroup badges={['ai', 'google']} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">
              Agricultural Weather Intelligence
            </h2>
            <p className="text-sky-100 text-xs font-semibold max-w-xl leading-relaxed">
              Real-time weather data transformed into actionable farming decisions using AI. Every forecast element leads to a recommendation.
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black">{weather.temperature}°C</p>
            <p className="text-sky-200 text-xs font-semibold mt-1">
              Feels like {weather.feels_like}°C • {weather.weather_desc}
            </p>
            <p className="text-sky-300/70 text-[10px] font-medium mt-0.5">
              Updated: {new Date(weather.last_updated).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* ===== SECTION 2: CURRENT CONDITIONS GRID ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Humidity', value: `${weather.humidity}%`, icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Rain Probability', value: `${weather.rain_probability}%`, icon: CloudRain, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/20' },
          { label: 'Wind Speed', value: `${weather.wind_speed} km/h`, icon: Wind, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/20' },
          { label: 'UV Index', value: `${weather.uv_index}`, icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Cloud Cover', value: `${weather.cloud_cover}%`, icon: CloudSun, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/40' },
          { label: 'Dry Spell Risk', value: weather.dry_spell_risk, icon: Flame, color: weather.dry_spell_risk === 'High' ? 'text-red-500' : weather.dry_spell_risk === 'Medium' ? 'text-amber-500' : 'text-green-500', bg: weather.dry_spell_risk === 'High' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Sunrise', value: weather.sunrise, icon: Sunrise, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
          { label: 'Sunset', value: weather.sunset, icon: Sunset, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm flex items-center gap-3"
            >
              <div className={`p-2.5 ${item.bg} rounded-xl`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">{item.label}</p>
                <p className="text-lg font-black text-gray-800 dark:text-zinc-200">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ===== SECTION 3: EXTREME WEATHER ALERTS ===== */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> Extreme Weather Alert System
        </h3>
        {weather.alerts.map((alert: any, idx: number) => {
          const style = getAlertStyle(alert.severity);
          return (
            <motion.div
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 ${style.bg} border ${style.border} rounded-xl flex items-start gap-3 shadow-sm`}
            >
              <AlertTriangle className={`h-5 w-5 ${style.icon} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${style.badgeClass}`}>
                    {style.badge}
                  </span>
                  <span className={`text-xs font-extrabold ${style.text}`}>{alert.type}</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">{alert.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ===== SECTION 4: 7-DAY AGRICULTURAL FORECAST ===== */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
        <h3 className="text-sm font-black text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-5 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
          <CloudSun className="h-5 w-5 text-sky-600" />
          7-Day Agricultural Forecast
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weather.daily_forecast?.map((day: any, idx: number) => {
            const { day: dayName, date } = formatDate(day.date);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50 rounded-xl p-3 text-center space-y-2"
              >
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">{dayName}</p>
                  <p className="text-[9px] text-gray-400 font-semibold">{date}</p>
                </div>

                <div className="flex justify-center">{getWeatherIcon(day.weather_code)}</div>
                <p className="text-[9px] text-gray-400 font-medium truncate">{day.weather_desc}</p>

                <div>
                  <p className="text-sm font-black text-gray-800 dark:text-zinc-200">
                    {day.temp_max}°
                    <span className="text-gray-400 font-semibold text-[10px] ml-0.5">/{day.temp_min}°</span>
                  </p>
                </div>

                <div className="space-y-1 text-[9px] font-semibold">
                  <div className="flex justify-between text-gray-500">
                    <span>Rain</span>
                    <span className="text-gray-700 dark:text-zinc-300">{day.rain_probability}%</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Wind</span>
                    <span className="text-gray-700 dark:text-zinc-300">{day.wind_max} km/h</span>
                  </div>
                </div>

                <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full border ${getFarmingStatusStyle(day.farming_status)}`}>
                  {day.farming_status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ===== SECTION 5: AI WEATHER IMPACT ENGINE ===== */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl p-6 shadow-premium space-y-5">
        <div className="flex flex-wrap justify-between items-start gap-4 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
          <div>
            <BadgesGroup badges={['ai', 'google', 'weather']} />
            <h3 className="text-lg font-black text-gray-800 dark:text-zinc-200 mt-2">
              AI Weather Impact Engine
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Gemini AI converts weather forecasts into personalized farming risk assessments
            </p>
          </div>
          <button
            onClick={fetchImpactAnalysis}
            disabled={impactLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md disabled:opacity-50"
          >
            {impactLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {impactLoading ? 'Analyzing...' : impactData ? 'Re-Analyze' : 'Analyze with Gemini AI'}
          </button>
        </div>

        {impactLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-xs font-bold text-gray-450">Gemini AI is analyzing weather patterns for your farm...</p>
          </div>
        )}

        {impactError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-4 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400">
            {impactError}
          </div>
        )}

        {impactData && !impactLoading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Risk Assessment Grid */}
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
                  Agricultural Risk Assessment
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Crop Stress', value: impactData.crop_stress_risk, icon: Thermometer },
                    { label: 'Disease Risk', value: impactData.disease_risk, icon: Bug },
                    { label: 'Waterlogging', value: impactData.waterlogging_risk, icon: Waves },
                    { label: 'Irrigation Need', value: impactData.irrigation_need, icon: Droplet },
                    { label: 'Heatwave Risk', value: impactData.heatwave_risk, icon: Flame },
                    { label: 'Pest Outbreak', value: impactData.pest_outbreak_risk, icon: Bug },
                  ].map((risk, idx) => {
                    const Icon = risk.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`p-3.5 rounded-xl border text-center ${getRiskStyle(risk.value)}`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1.5 opacity-70" />
                        <p className="text-[9px] font-bold uppercase opacity-80">{risk.label}</p>
                        <p className="text-sm font-black mt-0.5">{risk.value}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-sky-50/30 dark:bg-sky-950/10 p-4 rounded-xl border border-sky-200/40 space-y-3">
                  <h4 className="text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    AI Recommendations
                  </h4>
                  <div className="space-y-2">
                    {impactData.recommendations?.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-nature-50/30 dark:bg-nature-950/10 p-4 rounded-xl border border-nature-200/40 space-y-2">
                  <h4 className="text-[10px] font-black text-nature-700 dark:text-nature-400 uppercase tracking-wider">
                    Personalized Farm Advice
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {impactData.personalized_advice}
                  </p>
                </div>
              </div>

              {/* Impact Metrics */}
              {impactData.impact_metrics && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
                    Estimated Impact — Following AI Recommendations
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Water Saved', value: `${(impactData.impact_metrics.water_saved_liters / 1000).toFixed(1)}K L`, icon: Droplet, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                      { label: 'Yield Protected', value: `${impactData.impact_metrics.yield_protected_pct}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                      { label: 'Diseases Prevented', value: `${impactData.impact_metrics.diseases_prevented}`, icon: Shield, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20' },
                      { label: 'Profit Preserved', value: `₹${(impactData.impact_metrics.profit_preserved_inr / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                    ].map((metric, idx) => {
                      const Icon = metric.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${metric.bg} p-4 rounded-xl border border-gray-100 dark:border-zinc-800/60`}
                        >
                          <Icon className={`h-5 w-5 ${metric.color} mb-2`} />
                          <p className="text-[9px] font-bold text-gray-500 uppercase">{metric.label}</p>
                          <p className={`text-xl font-black ${metric.color} mt-0.5`}>{metric.value}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {!impactData && !impactLoading && (
          <div className="text-center py-8 space-y-3">
            <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-full w-fit mx-auto">
              <Sparkles className="h-8 w-8 text-sky-600" />
            </div>
            <p className="text-xs font-bold text-gray-500">
              Click "Analyze with Gemini AI" to generate personalized farming risk assessments from the current weather data.
            </p>
          </div>
        )}
      </div>

      {/* ===== SECTION 6: WEATHER-TO-ACTION WORKFLOW ===== */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
        <h3 className="text-sm font-black text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-5 border-b border-gray-50 dark:border-zinc-800/50 pb-3">
          <Zap className="h-4.5 w-4.5 text-amber-500" />
          Weather-to-Action Intelligence Pipeline
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2 py-2">
          {[
            { label: 'Weather Data', desc: 'Open-Meteo API', icon: CloudSun, color: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200/50' },
            { label: 'AI Analysis', desc: 'Gemini 2.5 Flash', icon: Sparkles, color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200/50' },
            { label: 'Risk Assessment', desc: '6 Risk Dimensions', icon: Shield, color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50' },
            { label: 'Recommendations', desc: 'Personalized Actions', icon: CheckCircle2, color: 'bg-nature-50 dark:bg-nature-950/20 border-nature-200/50' },
            { label: 'Impact Estimate', desc: 'Yield & Profit Protected', icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50' },
          ].map((step, idx, arr) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`${step.color} border p-3 rounded-xl text-center w-[130px] shadow-sm`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1.5 text-gray-600 dark:text-zinc-300" />
                  <p className="text-[10px] font-extrabold text-gray-800 dark:text-zinc-200">{step.label}</p>
                  <p className="text-[8px] text-gray-400 font-semibold mt-0.5">{step.desc}</p>
                </motion.div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-zinc-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
