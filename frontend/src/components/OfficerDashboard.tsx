import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getTranslation } from '../utils/translate';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, FolderHeart, BarChart3, Edit, CheckCircle, 
  MapPin, ShieldAlert, AlertTriangle, RefreshCw, Sparkles, Clock, CheckSquare, Target
} from 'lucide-react';
import { Badge, BadgesGroup } from './Badges';

interface OfficerDashboardProps {
  lang: string;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'cases' | 'farmers' | 'analytics'>('cases');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [diseaseChart, setDiseaseChart] = useState<any[]>([]);
  const [alertChart, setAlertChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected Case for Review
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [updatingCase, setUpdatingCase] = useState(false);

  // Officer AI District Intelligence states
  const [intelData, setIntelData] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const handleLoadIntel = async () => {
    try {
      setLoadingIntel(true);
      const res = await api.getDistrictIntelligence();
      setIntelData(res);
    } catch {
      // fallback handled gracefully
    } finally {
      setLoadingIntel(false);
    }
  };

  const fetchOfficerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const farmersData = await api.getOfficerFarmers();
      const casesData = await api.getOfficerCases();
      const diseaseData = await api.getDiseaseReport();
      const alertData = await api.getWeatherImpactReport();
      
      setFarmers(farmersData);
      setCases(casesData);
      setDiseaseChart(diseaseData);
      
      // Map alerts for charting
      setAlertChart(
        alertData.map((item: any) => ({
          alert: item.alert_type,
          count: item.count
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load agricultural officer portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerData();
    handleLoadIntel();
  }, []);

  const handleReviewCase = async (c: any) => {
    setSelectedCase(c);
    setRemarks(c.officer_remarks || '');
    
    // Automatically flag case as "in_progress" upon selection for audit
    if (c.status === 'pending') {
      try {
        await api.updateCaseStatus(c.case_id, 'in_progress');
        // Refresh local cases queue to sync progress indicators
        const casesData = await api.getOfficerCases();
        setCases(casesData);
      } catch (err) {
        console.error("Failed to transition case status: ", err);
      }
    }
  };

  const handleSubmitRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setUpdatingCase(true);
      
      // Update remarks
      await api.updateCaseRemarks(selectedCase.case_id, remarks);
      // Automatically resolve case when remarks are written
      await api.updateCaseStatus(selectedCase.case_id, 'resolved');
      
      setSelectedCase(null);
      setRemarks('');
      
      // Refresh listings
      fetchOfficerData();
    } catch (err: any) {
      alert(err.message || 'Failed to save remarks.');
    } finally {
      setUpdatingCase(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved') return 'text-green-700 bg-green-50 dark:bg-green-950/20 border-green-200';
    if (status === 'in_progress') return 'text-purple-700 bg-purple-50 dark:bg-purple-950/20 border-purple-200';
    return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return 'text-green-600';
    if (conf > 0.6) return 'text-amber-600';
    return 'text-red-500';
  };

  const pieColors = ['#488b4d', '#e67e22', '#c0392b', '#2c5930', '#d4af37', '#9cca9f'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-2" />
        <p className="font-semibold">{error}</p>
        <button onClick={fetchOfficerData} className="mt-4 px-4 py-2 bg-nature-600 text-white rounded-lg hover:bg-nature-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-200">
            Agricultural Officer Command Console
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Review diagnostics queues, access farmer logs, and analyze local threat levels.
          </p>
        </div>
        
        <button 
          onClick={fetchOfficerData}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Directory
        </button>
      </div>

      {/* Google AI District Intelligence Center (Copilot) */}
      <div className="bg-gradient-to-br from-indigo-900/10 via-indigo-950/5 to-transparent border border-indigo-500/20 p-6 rounded-2xl shadow-premium space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200">
                District AI Intelligence Center (Gemini Copilot)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold">Daily Threat Briefing & Automated Agronomist Action Items</p>
            </div>
          </div>
          <button
            onClick={handleLoadIntel}
            disabled={loadingIntel}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingIntel ? 'animate-spin' : ''}`} />
            Run System Audit
          </button>
        </div>

        {loadingIntel ? (
          <div className="text-center py-6 text-xs text-gray-400 font-semibold animate-pulse">
            Analyzing cases, outbreaks, and weather models...
          </div>
        ) : intelData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Column 1: AI Summary & Action Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-150/45">
                <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-[10px] uppercase mb-2 tracking-wide flex items-center gap-1">
                  <Sparkles size={12} /> Executive Copilot Summary
                </h4>
                <p className="leading-relaxed text-gray-700 dark:text-zinc-300 font-medium">
                  {intelData.district_summary}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-150/45">
                <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-[10px] uppercase mb-2.5 tracking-wide flex items-center gap-1">
                  <CheckSquare size={12} /> Recommended Government Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-medium">
                  {intelData.recommended_government_actions.map((act: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-zinc-800/40 rounded-lg">
                      <span className="text-indigo-600 font-black text-sm shrink-0">☐</span>
                      <span className="text-gray-700 dark:text-zinc-300 leading-normal">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Hotspots & Outreaches */}
            <div className="space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-150/45">
                <h4 className="font-extrabold text-red-650 text-[10px] uppercase mb-2 tracking-wide flex items-center gap-1">
                  <Target size={12} /> Disease Hotspots & Weather Risk Areas
                </h4>
                <div className="space-y-2 font-bold">
                  {intelData.top_risk_districts.map((zone: string, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-gray-700 dark:text-zinc-350">{zone}</span>
                      <span className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold border border-red-200/50">
                        Critical
                      </span>
                    </div>
                  ))}
                  {intelData.disease_hotspots.map((hotspot: string, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-gray-700 dark:text-zinc-350">{hotspot}</span>
                      <span className="bg-orange-50 text-orange-600 text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold border border-orange-200/50">
                        Outbreak
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-150/45">
                <h4 className="font-extrabold text-indigo-700 dark:text-indigo-400 text-[10px] uppercase mb-2 tracking-wide flex items-center gap-1">
                  <Clock size={12} /> Prioritized Outreaches
                </h4>
                <div className="space-y-2 font-bold text-[11px]">
                  {(intelData.farmer_outreach_priority || intelData.prioritized_farmer_outreach || []).map((outreach: string, i: number) => (
                    <div key={i} className="flex gap-2 items-center text-gray-700 dark:text-zinc-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                      <span>{outreach}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400 font-semibold">
            No report loaded. Click Run System Audit to generate Gemini intelligence summary.
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'cases'
              ? 'border-nature-600 text-nature-600 dark:text-nature-400'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FolderHeart className="h-4.5 w-4.5" />
          Cases Review Queue ({cases.filter(c => c.status === 'pending' || c.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setActiveTab('farmers')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'farmers'
              ? 'border-nature-600 text-nature-600 dark:text-nature-400'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Farmer Directory ({farmers.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-nature-600 text-nature-600 dark:text-nature-400'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          Disease & Weather Impact
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'cases' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case List */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium overflow-hidden">
              <div className="p-4 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">Referred Diagnostic Cases</h3>
              </div>

              {/* CRM Status Filter Selector Bar */}
              <div className="flex border-b border-gray-100 dark:border-zinc-800/80 px-4 bg-gray-50/20">
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                    statusFilter === 'pending'
                      ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Pending ({cases.filter(c => c.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('in_progress')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                    statusFilter === 'in_progress'
                      ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  In Progress ({cases.filter(c => c.status === 'in_progress').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                    statusFilter === 'resolved'
                      ? 'border-green-600 text-green-700 dark:text-green-400'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Resolved ({cases.filter(c => c.status === 'resolved').length})
                </button>
              </div>

              {(() => {
                const filteredCases = cases.filter(c => c.status === statusFilter);
                if (filteredCases.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      No active farmer cases match this status filter.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {filteredCases.map((c: any) => (
                      <div 
                        key={c.case_id}
                        className="p-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                        onClick={() => handleReviewCase(c)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-800 dark:text-zinc-200">{c.case_id}</span>
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
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(c.status)}`}>
                                {c.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold text-nature-600 mt-1">{c.disease_name}</p>
                          <p className="text-gray-400 font-medium">
                            Farmer: {c.farmer_name} ({c.farmer_id}) • Mobile: {c.farmer_mobile}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
                          <span className={`font-bold ${getConfidenceColor(c.confidence)}`}>
                            Confidence: {Math.round(c.confidence * 100)}%
                          </span>
                          <button className="flex items-center gap-1 text-nature-600 font-bold hover:underline">
                            <Edit className="h-3.5 w-3.5" />
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Case Details / Review Action Panel */}
            <div className="lg:col-span-1">
              {selectedCase ? (
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
                  <h3 className="font-bold text-gray-800 dark:text-zinc-200 text-sm pb-3 border-b border-gray-50 dark:border-zinc-800/50">
                    Review Case: {selectedCase.case_id}
                  </h3>

                  <form onSubmit={handleSubmitRemarks} className="space-y-4 mt-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold">Diagnosed Crop Disease</span>
                      <p className="font-bold text-gray-800 dark:text-zinc-200 mt-1">{selectedCase.disease_name}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold">Farmer Symptoms Logged</span>
                      <p className="text-gray-700 dark:text-zinc-300 mt-1 bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-gray-50 dark:border-zinc-800/40 leading-relaxed font-medium">
                        {selectedCase.symptoms.replace(/,/g, ', ')}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold">Initial Treatment Rec</span>
                      <p className="text-gray-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {selectedCase.treatment}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold mb-1.5">
                        Officer Remarks & Expert Advisory
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Add your expert recommendation remarks here..."
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-150 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs input-glow text-gray-800 dark:text-zinc-200 leading-relaxed"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={updatingCase}
                        className="flex-1 py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4.5 w-4.5" />
                        Resolve & Send
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCase(null)}
                        className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 text-center shadow-premium py-12 flex flex-col items-center">
                  <ShieldAlert className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-600">Select Case for Audit</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                    Click "Review" on any case ticket in the queue list to apply expert annotations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-premium overflow-hidden">
            <div className="p-4 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">Registered Farmers Directory</h3>
            </div>

            {farmers.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No farmers registered on the platform directory.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 text-gray-400 font-bold uppercase">
                      <th className="p-4">Farmer ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Soil details</th>
                      <th className="p-4">Preferred Lang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {farmers.map((f: any) => (
                      <tr key={f.farmer_id} className="hover:bg-gray-50/30 dark:hover:bg-zinc-800/10 transition font-medium">
                        <td className="p-4 font-bold text-gray-800 dark:text-zinc-200">{f.farmer_id}</td>
                        <td className="p-4">{f.name}</td>
                        <td className="p-4">{f.mobile}</td>
                        <td className="p-4 flex items-center gap-1 mt-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {f.village}, {f.district}, {f.state}
                        </td>
                        <td className="p-4">
                          {f.soil_type} Soil • pH {f.soil_ph} • {f.land_size} Acres
                        </td>
                        <td className="p-4 uppercase font-bold text-[10px] text-nature-600 bg-nature-50/50 dark:bg-nature-950/20 px-2 py-0.5 rounded w-fit inline-block mt-3">
                          {f.preferred_lang}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Disease Distribution Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
              <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                <FolderHeart className="h-4.5 w-4.5 text-red-500" />
                Aggregated Crop Diseases Distribution
              </h3>
              
              {diseaseChart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No disease analytics.</div>
              ) : (
                <div className="h-64 flex flex-col justify-between">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={diseaseChart}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {diseaseChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} Cases`} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="flex flex-wrap justify-center gap-3 mt-4 text-[9px] font-bold uppercase text-gray-400">
                    {diseaseChart.map((entry, idx) => (
                      <span key={entry.name} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                        {entry.name} ({entry.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Weather Impact Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-premium">
              <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                Aggregated Weather Alerts Issued
              </h3>
              
              {alertChart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No weather impact analytics.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertChart}>
                      <XAxis dataKey="alert" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#36703b" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
