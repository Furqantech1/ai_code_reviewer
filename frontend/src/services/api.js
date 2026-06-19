import axios from 'axios';

// In development, use empty string so requests go through the Vite proxy (same-origin).
// In production, set VITE_API_URL to the actual backend URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const analyzeCode = async (code, language) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
      code,
      language
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Analysis failed');
    } else if (error.request) {
      throw new Error('No response from server. Is the backend running?');
    } else {
      throw new Error('Error setting up request');
    }
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    return { status: 'offline' };
  }
};

export const exportPDF = async (code, language, review, docstring) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/export-pdf`, {
      code,
      language,
      review,
      docstring
    }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'PDF generation failed');
    } else if (error.request) {
      throw new Error('No response from server. Is the backend running?');
    } else {
      throw new Error('Error setting up request');
    }
  }
};
