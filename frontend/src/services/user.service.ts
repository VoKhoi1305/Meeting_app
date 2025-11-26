import api from './api';
import type { UserListItem } from '../types/user.types';

export const userService = {
  async getAllUsers(): Promise<UserListItem[]> {
    const { data } = await api.get('/users');
    return data.data;
  },

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    const { data } = await api.patch(`/users/${userId}/role`, { role });
    return data;
  },

  async toggleUserActive(userId: string) {
    const { data } = await api.patch(`/users/${userId}/toggle-active`);
    return data;
  },
};