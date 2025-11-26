import api from './api';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', credentials);
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};

