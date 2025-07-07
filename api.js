// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Client Class
class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set current user in localStorage
  setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // If unauthorized, clear auth data
      if (error.message.includes('401') || error.message.includes('403')) {
        this.removeAuthToken();
        window.location.href = 'login.html';
      }
      
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setAuthToken(response.token);
      this.setCurrentUser(response.user);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setAuthToken(response.token);
      this.setCurrentUser(response.user);
    }

    return response;
  }

  async getCurrentUserInfo() {
    return await this.request('/auth/me');
  }

  logout() {
    this.removeAuthToken();
    window.location.href = 'login.html';
  }

  // Todo methods
  async getTodos(filter = 'all') {
    const queryParam = filter !== 'all' ? `?filter=${filter}` : '';
    return await this.request(`/todos${queryParam}`);
  }

  async createTodo(todoData) {
    return await this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  }

  async updateTodo(id, todoData) {
    return await this.request(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todoData),
    });
  }

  async deleteTodo(id) {
    return await this.request(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async clearCompletedTodos() {
    return await this.request('/todos/completed/all', {
      method: 'DELETE',
    });
  }

  async getTodoStats() {
    return await this.request('/todos/stats');
  }
}

// Create global API client instance
const api = new APIClient();

// Utility functions for error handling and UI feedback
function showError(message, elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.style.color = 'red';
      element.style.display = 'block';
    }
  } else {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 5000);
  }
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2ed573;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    document.body.removeChild(successDiv);
  }, 3000);
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html') || currentPath.includes('index.html');
  
  if (!isAuthPage && !api.isAuthenticated()) {
    window.location.href = 'login.html';
  }
});