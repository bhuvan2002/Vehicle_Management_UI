import axios from 'axios';
import type { LoginRequest, LoginResponse, User, Vehicle } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getToken = (): string | null => {
  return sessionStorage.getItem('token');
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/Auth/login', credentials);
    return response.data;
  },
};

export const userService = {
    getUsers: async (): Promise<User[]> => {
      const response = await api.get<User[]>('/users');
      return response.data;
    },
    createUser: async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      address: string;
      password: string;
      role: string;
    }): Promise<User> => {
      const response = await api.post<User>('/users', userData);
      return response.data;
    },
    updateUser: async (id: number, userData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      address: string;
      role: string;
    }): Promise<void> => {
      await api.put(`/users/${id}`, userData);
    },
    deleteUser: async (id: number): Promise<void> => {
      await api.delete(`/users/${id}`);
    },
    getMyProfile: async (): Promise<User> => {
      const response = await api.get<User>('/my/profile');
      return response.data;
    },
  };

  export const vehicleService = {
    getVehicles: async (): Promise<Vehicle[]> => {
      const response = await api.get<Vehicle[]>('/vehicles');
      return response.data;
    },
    getVehicle: async (id: number): Promise<Vehicle> => {
      const response = await api.get<Vehicle>(`/vehicles/${id}`);
      return response.data;
    },
    createVehicle: async (vehicleData: {
      vehicleNumber: string;
      brand: string;
      model: string;
      currentChargePercentage: number;
      maxPayloadKg: number;
      chargingStatus: number; // Changed to number
    }): Promise<Vehicle> => {
      const response = await api.post<Vehicle>('/vehicles', vehicleData);
      return response.data;
    },
    updateVehicle: async (id: number, vehicleData: {
      vehicleNumber: string;
      brand: string;
      model: string;
      currentChargePercentage: number;
      maxPayloadKg: number;
      chargingStatus: number; // Changed to number
    }): Promise<void> => {
      await api.put(`/vehicles/${id}`, vehicleData);
    },
    deleteVehicle: async (id: number): Promise<void> => {
      await api.delete(`/vehicles/${id}`);
    },
    assignVehicle: async (vehicleId: number, userId: number): Promise<void> => {
      await api.post(`/vehicles/${vehicleId}/assign`, { userId });
    },
    unassignVehicle: async (vehicleId: number): Promise<void> => {
      await api.post(`/vehicles/${vehicleId}/unassign`);
    },
    getMyVehicles: async (): Promise<Vehicle[]> => {
      const response = await api.get<Vehicle[]>('/my/vehicles');
      return response.data;
    },
    getUserVehicles: async (userId: number): Promise<Vehicle[]> => {
      const response = await api.get<Vehicle[]>(`/users/${userId}/vehicles`);
      return response.data;
    },
  };

export default api;