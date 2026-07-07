const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API request helper with credentials configured to support secure HttpOnly tokens
async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  options.credentials = 'include'; // Essential for secure HTTP-only cookies
  
  // Set JSON headers if sending JSON payload
  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    // Session expired or unauthenticated
    // Handle redirect or clear local storage if needed in context
  }

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.detail || errorJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle empty content responses (like logout)
  if (response.status === 204) return null;
  
  return response.json();
}

export const api = {
  // Authentication
  async register(authPayload: any, profilePayload: any) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        user_reg: authPayload,
        farmer_data: profilePayload,
      }),
    });
  },

  async login(payload: any) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout() {
    return apiRequest('/api/auth/logout', { method: 'POST' });
  },

  async getMe() {
    return apiRequest('/api/auth/me');
  },

  // Farmer Profiles
  async getFarmerProfile() {
    return apiRequest('/api/farmers/profile');
  },

  async updateFarmerProfile(payload: any) {
    return apiRequest('/api/farmers/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getDashboard() {
    return apiRequest('/api/farmers/dashboard');
  },

  // Crop Recommendation
  async getCropRecommendation(payload: any) {
    return apiRequest('/api/crops/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCropComparisonList(soilType: string, soilPh: number, season: string) {
    return apiRequest(`/api/crops/comparison-list?soil_type=${encodeURIComponent(soilType)}&soil_ph=${soilPh}&season=${encodeURIComponent(season)}`);
  },

  // Weather Intelligence
  async getWeatherForecast(lat?: number, lon?: number) {
    const coords = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
    return apiRequest(`/api/weather/forecast${coords}`);
  },

  // Crop Health Log & Disease Diagnosis
  async uploadCropLog(formData: FormData) {
    return apiRequest('/api/cases/upload-log', {
      method: 'POST',
      body: formData, // FormData contains file uploads
    });
  },

  async diagnoseDisease(payload: any) {
    return apiRequest('/api/cases/diagnose', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async referCase(payload: any) {
    const params = new URLSearchParams(payload).toString();
    return apiRequest(`/api/cases/refer-case?${params}`, {
      method: 'POST'
    });
  },

  async getMyCases() {
    return apiRequest('/api/cases/my-cases');
  },

  // Chat AI Kisan Assistant
  async sendMessage(payload: any) {
    return apiRequest('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getChatHistory() {
    return apiRequest('/api/assistant/history');
  },

  // Officer Dashboard Operations
  async getOfficerFarmers() {
    return apiRequest('/api/officer/farmers');
  },

  async getOfficerCases() {
    return apiRequest('/api/officer/cases');
  },

  async updateCaseStatus(caseId: string, status: string) {
    return apiRequest(`/api/officer/cases/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async updateCaseRemarks(caseId: string, remarks: string) {
    return apiRequest(`/api/officer/cases/${caseId}/remarks`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    });
  },

  async getDiseaseReport() {
    return apiRequest('/api/officer/reports/diseases');
  },

  async getWeatherImpactReport() {
    return apiRequest('/api/officer/reports/weather-impact');
  },

  // Farmer → Officer Direct Messaging
  async contactOfficer(message: string) {
    return apiRequest('/api/assistant/contact-officer', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getMyOfficerReplies() {
    return apiRequest('/api/assistant/my-officer-replies');
  },

  // Officer side — read and reply to farmer messages
  async getFarmerMessages() {
    return apiRequest('/api/officer/farmer-messages');
  },

  async replyToFarmer(msgId: number, reply: string) {
    return apiRequest(`/api/officer/farmer-messages/${msgId}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply }),
    });
  },

  async closeFarmerMessage(msgId: number) {
    return apiRequest(`/api/officer/farmer-messages/${msgId}/close`, {
      method: 'PUT',
    });
  },

  // Hackathon Enhancements APIs
  async sendGeminiMessage(payload: { message: string }) {
    return apiRequest('/api/assistant/gemini-chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async diagnoseLeafVision(formData: FormData) {
    return apiRequest('/api/assistant/gemini-vision', {
      method: 'POST',
      body: formData,
    });
  },

  async getFarmerImpact() {
    return apiRequest('/api/farmers/impact');
  },

  async getDistrictIntelligence() {
    return apiRequest('/api/officer/district-intelligence');
  },

  async getSystemAnalytics() {
    return apiRequest('/api/analytics/system-metrics');
  },

  // Server-Side Text-to-Speech
  async generateTTSAudio(payload: { text: string; language: string }) {
    return apiRequest('/api/tts/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTTSAudioUrl(relativePath: string) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${API_BASE}${relativePath}`;
  },

  // Weather Intelligence Center
  async getWeatherIntelligence() {
    return apiRequest('/api/weather/intelligence');
  },

  async getWeatherImpactAnalysis() {
    return apiRequest('/api/weather/impact-analysis', {
      method: 'POST',
    });
  },
};
