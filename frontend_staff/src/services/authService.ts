import api from './api';

export const authService = {
  login: async (email: string, password: string, deviceId: string = 'web-staff') => {
    const response = await api.post('/Login/Login_Check', {
      email,
      password,
      Device_ID: deviceId,
    });
    return response.data;
  },

  checkOtp: async (email: string, otp: string) => {
    const response = await api.post('/Login/Check_OTP', { email, otp });
    return response.data;
  },

  generateForgotPassword: async (email: string) => {
    const response = await api.post('/Login/Generate-forget-Password', { email });
    return response.data;
  },

  changePassword: async (passwordData: any) => {
    const response = await api.post('/Login/change_password', passwordData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
  },
};
