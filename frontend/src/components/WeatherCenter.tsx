import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion } from 'framer-motion';
import { 
  CloudSun, Thermometer, Droplet, Wind, AlertTriangle, CloudRain, ShieldCheck 
} from 'lucide-react';

interface WeatherCenterProps {
  lang: string;
}

export const WeatherCenter: React.FC<WeatherCenterProps> = ({ lang }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getWeatherForecast();
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nature-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
        <button 
          onClick={fetchWeather} 
          className="mt-4 px-4 py-2 bg-nature-600 text-white rounded-lg hover:bg-nature-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const getDrySpellBadge = (risk: string) => {
    if (risk === 'High') return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/55';
    if (risk === 'Medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/55';
    return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/55';
  };

  return (
    <div className="space-y-6">
      {/* Heavy Warning Alerts */}
      {weather.alerts.length > 0 ? (
        <div className="space-y-3">
          {weather.alerts.map((alert: string, index: number) => (
            <motion.div 
              key={index}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3 shadow-sm"
            >
              <AlertTriangle className="h-5.5 w-5.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-400 text-xs">Hazard Alert Warning</h4>
                <p className="text-gray-700 dark:text-zinc-300 text-xs mt-1 leading-relaxed">{alert}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl flex items-center gap-3 shadow-sm">
          <ShieldCheck className="h-5.5 w-5.5 text-green-600" />
          <p className="text-green-800 dark:text-green-400 text-xs font-semibold">
            {getTranslation('noAlerts', lang)}
          </p>
        </div>
      )}

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Temp */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl">
            <Thermometer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Temperature</p>
            <p className="text-xl font-bold text-gray-800 dark:text-zinc-200 mt-0.5">{weather.temperature}°C</p>
          </div>
        </div>

        {/* Humidity */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
            <Droplet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Humidity</p>
            <p className="text-xl font-bold text-gray-800 dark:text-zinc-200 mt-0.5">{weather.humidity}%</p>
          </div>
        </div>

        {/* Rain Probability */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-500 rounded-xl">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Precipitation</p>
            <p className="text-xl font-bold text-gray-800 dark:text-zinc-200 mt-0.5">{weather.rain_probability}%</p>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-500 rounded-xl">
            <Wind className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Wind Speed</p>
            <p className="text-xl font-bold text-gray-800 dark:text-zinc-200 mt-0.5">{weather.wind_speed} km/h</p>
          </div>
        </div>
      </div>

      {/* Dry Spell Engine Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
        <h3 className="text-md font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2 mb-4">
          <Droplet className="h-5 w-5 text-nature-600" />
          Dry Spell Prediction Engine
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
          The dry spell risk is computed continuously by analyzing temperature forecasts, relative humidity drops, and lack of precipitation over the next 7 days.
        </p>

        <div className="flex items-center gap-4 mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl w-fit">
          <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">Current Risk Index:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDrySpellBadge(weather.dry_spell_risk)}`}>
            {weather.dry_spell_risk} Risk
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-gray-50 dark:border-zinc-800/50 pt-6 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-green-600 dark:text-green-400">Low Risk (&lt; 50)</span>
            <p className="text-gray-400">Adequate soil moisture and regular rain forecast. Standard watering is sufficient.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Medium Risk (50-75)</span>
            <p className="text-gray-400">No rain expected for 4-5 days. Check soil moisture daily and apply surface mulch.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-red-600 dark:text-red-400">High Risk (&gt; 75)</span>
            <p className="text-gray-400">Severe dry spell. Evapotranspiration is high. Drip irrigation or supplemental watering is highly critical.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
