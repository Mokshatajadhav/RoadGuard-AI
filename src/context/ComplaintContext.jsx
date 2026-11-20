import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_COMPLAINTS, MUNICIPAL_CREWS } from '../data/mockComplaints';
import apiService from '../services/api';

const ComplaintContext = createContext(null);
const STORAGE_KEY = 'roadguard_complaints_v1';

export function ComplaintProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [serverStats, setServerStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('roadguard_user_profile');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Transient toast notification
  const showToast = useCallback((message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev?.id ? null : prev));
    }, 4500);
  }, []);

  // Auth: Login
  const loginUser = async (email, password) => {
    try {
      const res = await apiService.login({ email, password });
      if (res?.token && res?.user) {
        localStorage.setItem('roadguard_auth_token', res.token);
        localStorage.setItem('roadguard_user_profile', JSON.stringify(res.user));
        setCurrentUser(res.user);
        showToast(`Welcome back, ${res.user.name}! (${res.user.role})`, 'success');
        return res.user;
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  // Auth: Register
  const registerUser = async (userData) => {
    try {
      const res = await apiService.register(userData);
      if (res?.token && res?.user) {
        localStorage.setItem('roadguard_auth_token', res.token);
        localStorage.setItem('roadguard_user_profile', JSON.stringify(res.user));
        setCurrentUser(res.user);
        showToast(`Account created successfully! Logged in as ${res.user.name}.`, 'success');
        return res.user;
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  // Auth: Logout
  const logoutUser = () => {
    localStorage.removeItem('roadguard_auth_token');
    localStorage.removeItem('roadguard_user_profile');
    setCurrentUser(null);
    showToast('Logged out of RoadGuard AI.', 'info');
  };

  // Fetch complaints from backend API
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First check health
      await apiService.checkHealth();
      setBackendConnected(true);

      const res = await apiService.getComplaints({ limit: 50 });
      if (res?.data) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.warn('[ComplaintContext] Backend API unreachable, falling back to local demo data:', err.message);
      setBackendConnected(false);
      setError('Backend API is currently offline. Operating in Local Demo Mode.');
      
      // Fallback to localStorage or mockComplaints
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setComplaints(JSON.parse(saved));
        } else {
          setComplaints(INITIAL_COMPLAINTS);
        }
      } catch (e) {
        setComplaints(INITIAL_COMPLAINTS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real analytics summary
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await apiService.getAnalyticsSummary();
      if (res?.data) {
        setServerStats(res.data);
      }
    } catch (err) {
      // Handled silently - client stats fallback will be used
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchComplaints();
    fetchAnalytics();
  }, [fetchComplaints, fetchAnalytics]);

  // Keep localStorage updated as fallback
  useEffect(() => {
    if (complaints.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      } catch (e) {
        // quota exceeded or private mode
      }
    }
  }, [complaints]);

  // Add new complaint
  const addComplaint = async (formData) => {
    try {
      // If backend is connected, use real API
      if (backendConnected) {
        const res = await apiService.createComplaint(formData);
        if (res?.data) {
          const newComplaint = res.data;
          setComplaints((prev) => [newComplaint, ...prev]);
          showToast(`Complaint ${newComplaint.complaintId} submitted to database!`, 'success');
          fetchAnalytics();
          return newComplaint;
        }
      }

      // If backend was not connected, try sending anyway; if error, use transparent fallback
      try {
        const res = await apiService.createComplaint(formData);
        if (res?.data) {
          setBackendConnected(true);
          const newComplaint = res.data;
          setComplaints((prev) => [newComplaint, ...prev]);
          showToast(`Complaint ${newComplaint.complaintId} submitted successfully!`, 'success');
          fetchAnalytics();
          return newComplaint;
        }
      } catch (apiErr) {
        // Do not silently pretend API succeeded if user expected backend
        console.warn('[ComplaintContext] Live API submission failed, saved to local session:', apiErr.message);
        
        // Local fallback generation
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newId = `RG-2026-${randomSuffix}`;
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const severity = formData.severity || 'Moderate';
        let priority = 'Medium';
        if (severity === 'Severe' || severity === 'high') priority = 'Critical';
        else if (severity === 'Moderate' || severity === 'medium') priority = 'High';
        else priority = 'Low';

        const fallbackComplaint = {
          id: newId,
          complaintId: newId,
          title: formData.title || `Pothole reported at ${formData.location?.slice(0, 32) || 'City Road'}`,
          description: formData.description || 'Reported by citizen through RoadGuard AI portal.',
          location: formData.location || 'Reported Location, Urban Sector',
          address: formData.location || '',
          coordinates: formData.coordinates || { lat: 12.9716, lng: 77.5946 },
          zone: formData.zone || 'Central Zone',
          ward: formData.ward || 'Ward 10 - Municipal Sector',
          priority: formData.priority || priority,
          priorityLabel: priority.toLowerCase(),
          status: 'submitted',
          severity: severity.toLowerCase(),
          reportedAt: formattedDate,
          reporterName: formData.reporterName || 'Citizen User',
          reporterContact: formData.reporterContact || '+91 9XXXX-XXXXX',
          imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
          aiAnalysis: formData.aiAnalysis || {
            confidence: 94.8,
            estimatedArea: '0.58 sq. m',
            estimatedDepth: '5.0 cm',
            surfaceType: 'Bituminous Asphalt',
            hazardScore: 65,
            duplicateCheck: 'Passed',
            detectedTags: ['Pothole Cavity', 'Demo Simulation'],
          },
          assignedCrew: null,
          timeline: [
            {
              step: 'Complaint Logged',
              timestamp: formattedDate,
              description: 'Citizen grievance submitted (Local Demo Mode).',
              actor: 'Citizen Portal',
              status: 'completed',
            },
          ],
        };

        setComplaints((prev) => [fallbackComplaint, ...prev]);
        showToast(`Complaint ${newId} logged in local session (Backend offline).`, 'info');
        return fallbackComplaint;
      }
    } catch (err) {
      showToast(`Error submitting complaint: ${err.message}`, 'error');
      throw err;
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (id, newStatus, note = '') => {
    try {
      if (backendConnected) {
        const res = await apiService.updateComplaintStatus(id, {
          status: newStatus,
          note: note || `Municipal official changed status to '${newStatus}'.`,
          actor: 'PWD Admin Desk',
        });

        if (res?.data) {
          setComplaints((prev) =>
            prev.map((item) => (item.complaintId === id || item.id === id ? res.data : item))
          );
          showToast(`Complaint ${id} status updated to "${newStatus}"`, 'info');
          fetchAnalytics();
          return res.data;
        }
      }

      // Local fallback if server offline
      setComplaints((prev) =>
        prev.map((item) => {
          if (item.id !== id && item.complaintId !== id) return item;

          const updatedTimeline = item.timeline ? [...item.timeline] : [];
          updatedTimeline.push({
            step: `Status Changed: ${newStatus}`,
            timestamp: new Date().toLocaleTimeString(),
            description: note || `Municipal official changed status to ${newStatus}.`,
            actor: 'PWD Admin Desk (Local)',
            status: 'completed',
          });

          return {
            ...item,
            status: newStatus,
            timeline: updatedTimeline,
          };
        })
      );
      showToast(`Complaint ${id} status updated in local session`, 'info');
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
      throw err;
    }
  };

  // Assign crew
  const assignCrew = async (id, crewName, targetTime = 'Within 48 hours') => {
    try {
      const matchedCrew = MUNICIPAL_CREWS.find((c) => c.name === crewName) || {
        name: crewName,
        lead: 'Designated Field Officer',
      };

      if (backendConnected) {
        const res = await apiService.assignEngineer(id, {
          engineerName: matchedCrew.name,
          supervisor: matchedCrew.lead,
          contact: '+91 80-2299-4400',
          targetCompletion: targetTime,
          note: `Dispatched to ${matchedCrew.lead}. Target SLA: ${targetTime}.`,
        });

        if (res?.data) {
          setComplaints((prev) =>
            prev.map((item) => (item.complaintId === id || item.id === id ? res.data : item))
          );
          showToast(`Assigned ${crewName} to complaint ${id}`, 'success');
          fetchAnalytics();
          return res.data;
        }
      }

      // Local fallback
      setComplaints((prev) =>
        prev.map((item) => {
          if (item.id !== id && item.complaintId !== id) return item;

          const updatedTimeline = item.timeline ? [...item.timeline] : [];
          updatedTimeline.push({
            step: `Repair Crew Assigned: ${crewName}`,
            timestamp: new Date().toLocaleTimeString(),
            description: `Dispatched to ${matchedCrew.lead}. Target SLA: ${targetTime}.`,
            actor: 'Operations Dispatch',
            status: 'completed',
          });

          return {
            ...item,
            status: item.status === 'submitted' || item.status === 'Pending Verification' ? 'Crew Assigned' : item.status,
            assignedCrew: {
              name: matchedCrew.name,
              supervisor: matchedCrew.lead,
              contact: '+91 80-2299-4400',
              targetCompletion: targetTime,
            },
            timeline: updatedTimeline,
          };
        })
      );
      showToast(`Assigned ${crewName} in local session`, 'success');
    } catch (err) {
      showToast(`Failed to assign crew: ${err.message}`, 'error');
      throw err;
    }
  };

  // Lookup complaint by ID (supports async fetch if not in local memory)
  const getComplaintById = useCallback(
    (id) => {
      if (!id) return null;
      const cleanId = id.trim().toUpperCase();
      return (
        complaints.find(
          (c) =>
            (c.complaintId && c.complaintId.toUpperCase() === cleanId) ||
            (c.id && c.id.toUpperCase() === cleanId)
        ) || null
      );
    },
    [complaints]
  );

  // Async version to fetch directly from backend if not found in state
  const fetchComplaintDetails = async (id) => {
    try {
      const res = await apiService.getComplaintById(id);
      return res?.data || null;
    } catch (err) {
      return getComplaintById(id);
    }
  };

  // Endorse / support an existing complaint
  const supportExistingComplaint = async (id, supportPayload) => {
    try {
      const res = await apiService.supportComplaint(id, supportPayload);
      showToast(res.message || 'Support registered successfully!', 'success');
      await fetchComplaints();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to register support', 'error');
      throw err;
    }
  };

  // Review a duplicate complaint (link or mark distinct)
  const reviewDuplicateComplaint = async (id, reviewData) => {
    try {
      const res = await apiService.reviewDuplicate(id, reviewData);
      showToast(res.message || 'Duplicate review updated', 'success');
      await fetchComplaints();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to update duplicate review', 'error');
      throw err;
    }
  };

  // Record completed repair with AFTER image
  const recordComplaintRepair = async (id, repairData) => {
    try {
      const res = await apiService.recordRepair(id, repairData);
      showToast(res.message || 'Repair evidence recorded successfully!', 'success');
      await fetchComplaints();
      await fetchAnalytics();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to record repair evidence', 'error');
      throw err;
    }
  };

  // Citizen verify repair (confirm or dispute)
  const verifyComplaintRepair = async (id, verificationData) => {
    try {
      const res = await apiService.verifyRepair(id, verificationData);
      showToast(res.message || 'Repair verification submitted!', 'success');
      await fetchComplaints();
      await fetchAnalytics();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to submit verification', 'error');
      throw err;
    }
  };

  // Admin verification action (approve closure, reopen, request evidence)
  const adminVerifyComplaint = async (id, adminData) => {
    try {
      const res = await apiService.adminVerify(id, adminData);
      showToast(res.message || 'Admin verification updated!', 'success');
      await fetchComplaints();
      await fetchAnalytics();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to update admin verification', 'error');
      throw err;
    }
  };

  // Fetch advanced analytics with filters
  const fetchAdvancedAnalytics = useCallback(async (filters = {}) => {
    try {
      const res = await apiService.getAdvancedAnalytics(filters);
      return res;
    } catch (err) {
      console.warn('[ComplaintContext] Advanced analytics fetch error:', err.message);
      throw err;
    }
  }, []);

  // Reset to initial mock data
  const resetToSampleData = async () => {
    setComplaints(INITIAL_COMPLAINTS);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Reset to original sample data', 'info');
    fetchComplaints();
  };

  // Derived statistics: uses real server analytics if available, or derives from complaints array
  const stats = serverStats || {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'submitted' || c.status === 'Pending Verification').length,
    inProgress: complaints.filter(
      (c) => c.status === 'in_progress' || c.status === 'In Progress' || c.status === 'assigned' || c.status === 'Crew Assigned'
    ).length,
    resolved: complaints.filter((c) => c.status === 'resolved' || c.status === 'Resolved').length,
    critical: complaints.filter((c) => c.priority === 'Critical' || c.priorityLabel === 'critical' || c.severity === 'high').length,
    resolutionRate:
      complaints.length > 0
        ? Math.round(
            (complaints.filter((c) => c.status === 'resolved' || c.status === 'Resolved').length /
              complaints.length) *
              100
          )
        : 0,
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        stats,
        loading,
        error,
        backendConnected,
        addComplaint,
        updateComplaintStatus,
        assignCrew,
        supportExistingComplaint,
        reviewDuplicateComplaint,
        recordComplaintRepair,
        verifyComplaintRepair,
        adminVerifyComplaint,
        getComplaintById,
        fetchComplaintDetails,
        resetToSampleData,
        refreshComplaints: fetchComplaints,
        fetchAdvancedAnalytics,
        currentUser,
        loginUser,
        registerUser,
        logoutUser,
        notification,
        showToast,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
}
