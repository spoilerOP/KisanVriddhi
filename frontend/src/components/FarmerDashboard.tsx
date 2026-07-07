import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion } from 'framer-motion';
import { 
  Sprout, CloudSun, AlertTriangle, HelpCircle, 
  Droplet, Compass, Thermometer, Wind, RefreshCw, FileText
} from 'lucide-react';
import { Badge, BadgesGroup } from './Badges';

interface FarmerDashboardProps {
  lang: string;
  onNavigate: (tab: string) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ lang, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getDashboard();
      setData(response);
      
      // Fetch dynamic AI impact metrics
      const impactRes = await api.getFarmerImpact();
      setImpactData(impactRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
        <p className="mt-4 text-gray-600 dark:text-zinc-400 font-medium">
          {getTranslation('loading', lang)}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6 text-center my-6">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
        <button 
          onClick={fetchDashboard} 
          className="mt-4 px-4 py-2 bg-nature-600 text-white rounded-lg hover:bg-nature-700 transition"
        >
          {getTranslation('tryAgain', lang)}
        </button>
      </div>
    );
  }

  const {
    profile,
    farm_summary,
    active_crop,
    weather_summary,
    alerts_center,
    risk_breakdown,
    recent_alerts,
    cases_summary
  } = data;

  const getRiskBadgeColor = (risk: string) => {
    if (risk === 'Critical') return 'bg-red-200 text-red-900 border-red-400';
    if (risk === 'High') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (risk === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getSeverityBannerColor = (sev: string) => {
    if (sev === 'Critical') return 'from-red-50 to-red-100 border-red-500 text-red-900 dark:from-red-950/30 dark:to-red-900/10 dark:border-red-600';
    if (sev === 'High') return 'from-orange-50 to-orange-100 border-orange-500 text-orange-950 dark:from-orange-950/30 dark:to-orange-900/10 dark:border-orange-600';
    if (sev === 'Medium') return 'from-amber-50 to-amber-100 border-amber-500 text-amber-950 dark:from-amber-950/30 dark:to-amber-900/10 dark:border-amber-600';
    return 'from-green-50 to-green-100 border-green-500 text-green-950 dark:from-green-950/30 dark:to-green-900/10 dark:border-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Alert Center - Dynamic Animated Warnings */}
      {alerts_center && alerts_center.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
            Active Smart Risks & Alerts
          </h3>
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 gap-3.5"
          >
            {alerts_center.map((alert: any, idx: number) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 }
                }}
                className={`p-4 bg-gradient-to-r ${getSeverityBannerColor(alert.severity)} border-l-4 rounded-r-xl shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="flex gap-3 items-start">
                  <AlertTriangle className="h-5.5 w-5.5 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm uppercase tracking-wide">
                        {alert.type} Risk
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getRiskBadgeColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed font-semibold opacity-95">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-black/5 dark:border-white/5 md:max-w-md shrink-0">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-nature-700 dark:text-nature-400 block mb-0.5">
                    {getTranslation('recommendedAction', lang)}:
                  </span>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {alert.recommendation}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Grid 1: Welcome & Farm Risk Breakdown & Impact Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 p-6 bg-gradient-to-br from-nature-600 to-nature-800 text-white rounded-2xl shadow-premium relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6">
            <Sprout size={200} />
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-medium">
                {profile.farmer_id}
              </span>
              <BadgesGroup badges={['ai', 'expert', 'google']} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-sans mt-3">
              {getTranslation('greeting', lang)}, {profile.name}!
            </h2>
            <p className="text-nature-100 text-sm mt-1">
              {getTranslation('villageLabel', lang)}: {profile.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <button 
              onClick={() => onNavigate('profile')}
              className="bg-white text-nature-800 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-nature-50 transition shadow-sm"
            >
              {getTranslation('configureFarm', lang)}
            </button>
            <button 
              onClick={() => onNavigate('assistant')}
              className="bg-nature-900/30 hover:bg-nature-950/30 border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
            >
              {getTranslation('chatWithAssistant', lang)}
            </button>
          </div>
        </div>

        {/* Improved Risk Score breakdown card */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wide">
                {getTranslation('farmRiskScore', lang)}
              </h3>
              <Badge type="weather" />
            </div>
            
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-gray-800 dark:text-zinc-200">
                {risk_breakdown?.overall_score || 0}%
              </span>
              <span className="text-xs font-bold text-gray-400">{getTranslation('suitabilityIndex', lang)}</span>
            </div>

            {/* Overall progress indicator bar */}
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2.5 mt-3">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  (risk_breakdown?.overall_score || 0) < 40 
                    ? 'bg-green-500' 
                    : (risk_breakdown?.overall_score || 0) < 70 
                      ? 'bg-amber-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${risk_breakdown?.overall_score || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 border-t border-gray-50 dark:border-zinc-800/60 pt-3 text-[11px]">
            {/* Weather Risk */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold">{getTranslation('weatherRisk', lang)}:</span>
              <span className={`px-2 py-0.5 font-black rounded-full text-[9px] border ${getRiskBadgeColor(risk_breakdown?.weather_risk || 'Low')}`}>
                {risk_breakdown?.weather_risk || 'Low'}
              </span>
            </div>
            {/* Water Risk */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold">{getTranslation('waterRisk', lang)}:</span>
              <span className={`px-2 py-0.5 font-black rounded-full text-[9px] border ${getRiskBadgeColor(risk_breakdown?.water_risk || 'Low')}`}>
                {risk_breakdown?.water_risk || 'Low'}
              </span>
            </div>
            {/* Disease Risk */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold">{getTranslation('diseaseRisk', lang)}:</span>
              <span className={`px-2 py-0.5 font-black rounded-full text-[9px] border ${getRiskBadgeColor(risk_breakdown?.disease_risk || 'Low')}`}>
                {risk_breakdown?.disease_risk || 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* NEW Expected Impact Card */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-2xl shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wide">
                Expected AI Yield Impact
              </h3>
              <Badge type="gov" />
            </div>
            
            {impactData ? (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-1.5">
                  <span className="text-[11px] text-gray-500 font-semibold">Yield Increase:</span>
                  <span className="text-xs font-black text-emerald-600">+{impactData.yield_increase_pct}%</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-1.5">
                  <span className="text-[11px] text-gray-500 font-semibold">Water Savings:</span>
                  <span className="text-xs font-black text-blue-500">-{impactData.water_savings_pct}%</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-850 pb-1.5">
                  <span className="text-[11px] text-gray-500 font-semibold">Disease Reduction:</span>
                  <span className="text-xs font-black text-purple-500">-{impactData.disease_reduction_pct}%</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-gray-500 font-semibold">Est. Profit Uplift:</span>
                  <span className="text-xs font-extrabold text-nature-600 dark:text-nature-400">
                    +₹{impactData.profit_increase_inr.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                Computing impact parameters...
              </div>
            )}
          </div>

          <div className="mt-2 text-[9px] text-gray-400 leading-relaxed font-semibold">
            Based on soil pH match, dynamic forecast rainfall index, and advisor mitigation.
          </div>
        </div>
      </div>

      {/* Grid 2: Core Dashboard Cards */}
      <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-200 mt-6">
        {getTranslation('dashboardMetrics', lang)}
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Crop */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-premium hover:shadow-md transition">
          <div className="p-2 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-lg w-fit">
            <Sprout className="h-5 w-5" />
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-medium">
            {getTranslation('activeCrop', lang)}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1 truncate">
            {active_crop}
          </p>
        </div>

        {/* Weather Status */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-premium hover:shadow-md transition">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-lg w-fit">
            <CloudSun className="h-5 w-5" />
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-medium">
            {getTranslation('weatherStatus', lang)}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1 truncate">
            {weather_summary.temperature}°C, {weather_summary.humidity}% Humidity
          </p>
        </div>

        {/* Dry Spell Risk */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-premium hover:shadow-md transition">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg w-fit">
            <Droplet className="h-5 w-5" />
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-medium">
            {getTranslation('drySpellRisk', lang)}
          </p>
          <p className={`text-sm font-bold mt-1 ${
            weather_summary.dry_spell_risk === 'High' ? 'text-red-500' : weather_summary.dry_spell_risk === 'Medium' ? 'text-amber-500' : 'text-green-500'
          }`}>
            {weather_summary.dry_spell_risk}
          </p>
        </div>

        {/* Soil Status */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-premium hover:shadow-md transition">
          <div className="p-2 bg-nature-50 dark:bg-nature-950/20 text-nature-600 rounded-lg w-fit">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-medium">
            {getTranslation('soilLabel', lang)}: {farm_summary.soil_type}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">
            pH: {farm_summary.soil_ph}
          </p>
        </div>

        {/* Expert Cases */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl shadow-premium hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg w-fit">
            <HelpCircle className="h-5 w-5" />
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3 font-medium">
            {getTranslation('expertCases', lang)}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-1">
            {cases_summary.open} Open / {cases_summary.resolved} Solved
          </p>
        </div>
      </div>

      {/* Grid 3: Two Column detail grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Forecast Details */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-nature-600" />
              {getTranslation('weatherForecast', lang)}
            </h4>
            <button 
              onClick={() => onNavigate('weather')}
              className="text-xs font-semibold text-nature-600 dark:text-nature-400 hover:underline"
            >
              {getTranslation('details', lang)}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
              <Thermometer className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-400">{getTranslation('tempLabel', lang)}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{weather_summary.temperature}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
              <Droplet className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">{getTranslation('humidityLabel', lang)}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{weather_summary.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
              <CloudSun className="h-5 w-5 text-sky-500" />
              <div>
                <p className="text-xs text-gray-400">{getTranslation('rainProb', lang)}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{weather_summary.rain_probability}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl">
              <Wind className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-xs text-gray-400">{getTranslation('windLabel', lang)}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{weather_summary.wind_speed} km/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis Ticket History */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              {getTranslation('recentDiagnosis', lang)}
            </h4>
            <button 
              onClick={() => onNavigate('disease')}
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              {getTranslation('newUpload', lang)}
            </button>
          </div>
          
          {cases_summary.history.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {getTranslation('noReports', lang)}
            </div>
          ) : (
            <div className="space-y-3">
              {cases_summary.history.map((c: any) => (
                <div 
                  key={c.case_id}
                  className="flex items-center justify-between p-3 border border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 rounded-xl text-xs transition"
                >
                  <div>
                    <p className="font-bold text-gray-800 dark:text-zinc-200">{c.disease_name}</p>
                    <p className="text-gray-400 mt-0.5">{c.case_id} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 font-semibold rounded-full ${
                    c.status === 'open' ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/20' : 'text-green-700 bg-green-50 dark:bg-green-950/20'
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
