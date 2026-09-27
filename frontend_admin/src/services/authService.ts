import api from './api';

export const authService = {
  login: async (email: string, password: string, deviceId: string = 'web-admin') => {
    const response = await api.post('/Login/Login_Check', {
      email,
      password,
      Device_ID: deviceId,
    });
    return response.data;
  },

  deactivateAccount: async (details: any) => {
    const response = await api.post('/deactivate_Account/', details);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
