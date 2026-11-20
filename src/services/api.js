/**
 * RoadGuard AI - API Client Service
 * Uses VITE_API_BASE_URL when specified, or defaults to relative '/api'
 * which is automatically proxied to http://localhost:5000 in Vite dev mode.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };

  // Attach JWT token from localStorage if present
  try {
    const token = localStorage.getItem('roadguard_auth_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage unavailable
  }

  // If sending FormData, do not set Content-Type header so the browser sets the boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `HTTP error ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const apiService = {
  /**
   * User Authentication APIs
   */
  async register(userData) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getMe() {
    return request('/api/auth/me');
  },

  /**
   * Check backend server and MongoDB status
   */
  async checkHealth() {
    return request('/api/health');
  },

  /**
   * Fetch complaints list with optional filtering & pagination
   */
  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.severity && params.severity !== 'All') query.append('severity', params.severity);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.zone && params.zone !== 'All' && params.zone !== 'All Zones') query.append('zone', params.zone);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = `/api/complaints${queryString ? `?${queryString}` : ''}`;
    return request(endpoint);
  },

  /**
   * Retrieve complaint by public complaintId or Mongo ID
   */
  async getComplaintById(id) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}`);
  },

  /**
   * Create a new complaint.
   * If payload has an image File, sends multipart/form-data.
   * Otherwise sends JSON.
   */
  async createComplaint(payload) {
    if (payload instanceof FormData) {
      return request('/api/complaints', {
        method: 'POST',
        body: payload,
      });
    }

    if (payload.imageFile instanceof File) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === 'imageFile') {
          formData.append('image', payload.imageFile);
        } else if (payload[key] !== undefined && payload[key] !== null) {
          if (typeof payload[key] === 'object') {
            formData.append(key, JSON.stringify(payload[key]));
          } else {
            formData.append(key, payload[key]);
          }
        }
      });
      return request('/api/complaints', {
        method: 'POST',
        body: formData,
      });
    }

    return request('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update complaint status
   */
  async updateComplaintStatus(id, { status, note, actor }) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, actor }),
    });
  },

  /**
   * Assign a maintenance crew / engineer
   */
  async assignEngineer(id, assignmentData) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(assignmentData),
    });
  },

  /**
   * Record repair completion with AFTER-repair image
   */
  async recordRepair(id, repairData) {
    if (!id) throw new Error('Complaint ID is required');

    if (repairData instanceof FormData) {
      return request(`/api/complaints/${encodeURIComponent(id)}/repair`, {
        method: 'PATCH',
        body: repairData,
      });
    }

    if (repairData?.afterImageFile instanceof File) {
      const formData = new FormData();
      Object.keys(repairData).forEach((key) => {
        if (key === 'afterImageFile') {
          formData.append('afterImage', repairData.afterImageFile);
        } else if (repairData[key] !== undefined && repairData[key] !== null) {
          formData.append(key, repairData[key]);
        }
      });
      return request(`/api/complaints/${encodeURIComponent(id)}/repair`, {
        method: 'PATCH',
        body: formData,
      });
    }

    return request(`/api/complaints/${encodeURIComponent(id)}/repair`, {
      method: 'PATCH',
      body: JSON.stringify(repairData),
    });
  },

  /**
   * Citizen verification of completed repair (confirm or dispute)
   */
  async verifyRepair(id, payload) {
    if (!id) throw new Error('Complaint ID is required');

    if (payload instanceof FormData) {
      return request(`/api/complaints/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        body: payload,
      });
    }

    if (payload?.unsatisfactoryImageFile instanceof File) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === 'unsatisfactoryImageFile') {
          formData.append('unsatisfactoryImage', payload.unsatisfactoryImageFile);
        } else if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });
      return request(`/api/complaints/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        body: formData,
      });
    }

    return request(`/api/complaints/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Admin verification actions (approve closure, reopen, request evidence)
   */
  async adminVerify(id, payload) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}/admin-verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch aggregated analytics summary
   */
  async getAnalyticsSummary() {
    return request('/api/analytics/summary');
  },

  /**
   * Run pothole detection on an uploaded image file.
   * Sends multipart/form-data with the image to /api/detect.
   * Returns: { success, imageUrl, inferenceMs, detection: { detections[], severity, hazardScore, ... } }
   */
  async detectPothole(imageFile) {
    if (!(imageFile instanceof File)) {
      throw new Error('detectPothole requires a File object');
    }
    const formData = new FormData();
    formData.append('image', imageFile);
    return request('/api/detect', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Pre-submission duplicate check
   */
  async checkDuplicate(payload) {
    if (payload instanceof FormData) {
      return request('/api/complaints/check-duplicate', {
        method: 'POST',
        body: payload,
      });
    }

    if (payload.imageFile instanceof File) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === 'imageFile') {
          formData.append('image', payload.imageFile);
        } else if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });
      return request('/api/complaints/check-duplicate', {
        method: 'POST',
        body: formData,
      });
    }

    return request('/api/complaints/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Endorse / support an existing complaint
   */
  async supportComplaint(id, payload = {}) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}/support`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Admin review of a duplicate match (link or mark distinct)
   */
  async reviewDuplicate(id, { action, masterComplaintId, note, actor }) {
    if (!id) throw new Error('Complaint ID is required');
    return request(`/api/complaints/${encodeURIComponent(id)}/duplicate-review`, {
      method: 'PATCH',
      body: JSON.stringify({ action, masterComplaintId, note, actor }),
    });
  },

  /**
   * Fetch advanced analytics aggregation with functional filters
   */
  async getAdvancedAnalytics(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.severity && params.severity !== 'All') query.append('severity', params.severity);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.zone && params.zone !== 'All' && params.zone !== 'All Zones') query.append('zone', params.zone);
    if (params.crew && params.crew !== 'All') query.append('crew', params.crew);

    const qs = query.toString();
    return request(`/api/complaints/analytics/advanced${qs ? `?${qs}` : ''}`);
  },
};

export default apiService;
