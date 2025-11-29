const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API request error:', error);
      // Provide more helpful error messages
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to the server. Please make sure the backend API is running on http://localhost:5000'
        );
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const response = await this.request<{ user: any; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(username: string, password: string) {
    const response = await this.request<{ user: any; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // File endpoints
  async uploadFile(
    file: File,
    companyId: string,
    reportTypeId: string,
    formData?: Record<string, any>
  ) {
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('companyId', companyId);
    formDataToSend.append('reportTypeId', reportTypeId);
    if (formData) {
      formDataToSend.append('formData', JSON.stringify(formData));
    }

    const url = `${this.baseUrl}/files/upload`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formDataToSend,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }

    return data;
  }

  async getFiles(params?: {
    companyId?: string;
    reportTypeId?: string;
    analysisStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{ files: any[]; pagination: any }>(
      `/files${queryString ? `?${queryString}` : ''}`
    );
  }

  async getFile(id: string) {
    return this.request<{ file: any }>(`/files/${id}`);
  }

  async downloadFile(id: string) {
    const url = `${this.baseUrl}/files/${id}/download`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    // Check if response is an error - only parse as JSON if it's an error
    if (!response.ok) {
      // Clone the response to read it without consuming the body
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      } else {
        const text = await response.text();
        throw new Error(text || `Download failed with status ${response.status}`);
      }
    }

    // For successful responses, directly convert to blob (don't try to parse as JSON)
    const blob = await response.blob();
    
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'download';
    
    if (contentDisposition) {
      // Handle RFC 5987 encoded filenames (filename*=UTF-8''encoded-name)
      const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
      if (rfc5987Match) {
        try {
          filename = decodeURIComponent(rfc5987Match[1]);
        } catch (e) {
          console.warn('Failed to decode RFC 5987 filename:', e);
        }
      } else {
        // Fallback to standard filename
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
          // Try to decode if it's URL encoded
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }
    }

    const url_obj = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_obj;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url_obj);
  }

  async getDraftBlob(id: string): Promise<Blob> {
    const url = `${this.baseUrl}/files/${id}/download-draft`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch draft';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch (e2) {
          // Use default message
        }
      }
      throw new Error(errorMessage);
    }

    return await response.blob();
  }

  async downloadDraft(id: string) {
    try {
      const blob = await this.getDraftBlob(id);
      const url_obj = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_obj;
      link.download = 'draft.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_obj);
    } catch (error: any) {
      throw error;
    }
  }

  async updateFileAnalysis(id: string, analysisStatus: string, analysisResult?: any) {
    return this.request<{ file: any }>(`/files/${id}/analysis`, {
      method: 'PUT',
      body: JSON.stringify({ analysisStatus, analysisResult }),
    });
  }

  async deleteFile(id: string) {
    return this.request(`/files/${id}`, { method: 'DELETE' });
  }

  // Log endpoints
  async getLogs(params?: {
    action?: string;
    resource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{ logs: any[]; pagination: any }>(
      `/logs${queryString ? `?${queryString}` : ''}`
    );
  }

  async getLogStats(params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{ total: number; byAction: any; byStatus: any; byResource: any }>(
      `/logs/stats${queryString ? `?${queryString}` : ''}`
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
