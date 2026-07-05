import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { Save, Compass, Thermometer, Info } from 'lucide-react';

interface FarmProfileProps {
  lang: string;
}

export const FarmProfile: React.FC<FarmProfileProps> = ({ lang }) => {
  const [profile, setProfile] = useState<any>({
    land_size: 0.0,
    soil_type: 'Alluvial',
    soil_ph: 7.0,
    irrigation_method: 'Rainfed',
    groundwater_depth: 0.0,
    crop_history: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getFarmerProfile();
      setProfile({
        land_size: data.land_size,
        soil_type: data.soil_type,
        soil_ph: data.soil_ph,
        irrigation_method: data.irrigation_method,
        groundwater_depth: data.groundwater_depth,
        crop_history: data.crop_history
      });
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to fetch farm profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg({ text: '', type: '' });
      await api.updateFarmerProfile(profile);
      setMsg({ text: 'Profile saved successfully!', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nature-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">
        <Compass className="h-6 w-6 text-nature-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-200">
            {getTranslation('farmProfile', lang)}
          </h2>
          <p className="text-xs text-gray-400">
            Update your soil characteristics and farm parameters to calibrate the AI model.
          </p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold mb-6 ${
          msg.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/30' 
            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30'
        }`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Land Size */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {getTranslation('landSize', lang)}
            </label>
            <input 
              type="number"
              step="0.1"
              value={profile.land_size}
              onChange={e => setProfile({ ...profile, land_size: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
              required
            />
          </div>

          {/* Soil Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {getTranslation('soilType', lang)}
            </label>
            <select
              value={profile.soil_type}
              onChange={e => setProfile({ ...profile, soil_type: e.target.value })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
            >
              <option value="Alluvial">Alluvial (जलोढ़)</option>
              <option value="Black">Black (काली मिट्टी)</option>
              <option value="Clayey">Clayey (चिकनी मिट्टी)</option>
              <option value="Sandy">Sandy (रेतीली मिट्टी)</option>
              <option value="Loamy">Loamy (दोमट)</option>
              <option value="Red">Red (लाल मिट्टी)</option>
            </select>
          </div>
        </div>

        {/* Soil pH Range */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
            <span>{getTranslation('soilPh', lang)}</span>
            <span className="text-nature-600 font-bold bg-nature-50 dark:bg-nature-950/20 px-2 py-0.5 rounded">
              {profile.soil_ph}
            </span>
          </div>
          <input 
            type="range"
            min="0"
            max="14"
            step="0.1"
            value={profile.soil_ph}
            onChange={e => setProfile({ ...profile, soil_ph: parseFloat(e.target.value) })}
            className="w-full accent-nature-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
            <span>0 (Highly Acidic)</span>
            <span>7 (Neutral)</span>
            <span>14 (Highly Alkaline)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Irrigation Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {getTranslation('irrigation', lang)}
            </label>
            <select
              value={profile.irrigation_method}
              onChange={e => setProfile({ ...profile, irrigation_method: e.target.value })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
            >
              <option value="Rainfed">Rainfed (वर्षा आधारित)</option>
              <option value="Drip Irrigation">Drip Irrigation (टपक सिंचाई)</option>
              <option value="Sprinkler">Sprinkler (फव्वारा सिंचाई)</option>
              <option value="Flood Irrigation">Flood Irrigation (बाढ़ सिंचाई)</option>
            </select>
          </div>

          {/* Groundwater Depth */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {getTranslation('groundwater', lang)}
            </label>
            <input 
              type="number"
              step="0.1"
              value={profile.groundwater_depth}
              onChange={e => setProfile({ ...profile, groundwater_depth: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
              required
            />
          </div>
        </div>

        {/* Crop History / Active Crop */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
            {getTranslation('history', lang)} (Comma separated, latest crop first)
          </label>
          <input 
            type="text"
            placeholder="e.g. Rice, Wheat, Cotton"
            value={profile.crop_history}
            onChange={e => setProfile({ ...profile, crop_history: e.target.value })}
            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm input-glow text-gray-800 dark:text-zinc-200"
          />
          <div className="flex gap-1.5 items-center mt-1.5 text-[10px] text-gray-400 font-medium">
            <Info className="h-3.5 w-3.5 text-gray-400" />
            <span>The first crop in the list will be treated as your Active Crop.</span>
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : getTranslation('save', lang)}
        </button>
      </form>
    </div>
  );
};
