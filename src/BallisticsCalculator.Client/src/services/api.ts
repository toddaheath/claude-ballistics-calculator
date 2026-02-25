import axios from 'axios';
import type { AuthResponse, Cartridge, LoginRequest, RegisterRequest, TrajectoryRequest, TrajectoryResponse } from '../types';
import { mockCartridges, mockTrajectoryData } from './mockData';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
});

// Inject JWT token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getCartridges(): Promise<Cartridge[]> {
  if (isDemoMode) {
    return mockCartridges;
  }
  const response = await client.get<Cartridge[]>('/cartridges');
  return response.data;
}

export async function calculateTrajectory(request: TrajectoryRequest): Promise<TrajectoryResponse> {
  if (isDemoMode) {
    const unit = request.unitSystem === 'meters' ? 'meters' : 'yards';
    return mockTrajectoryData[unit];
  }
  const response = await client.post<TrajectoryResponse>('/trajectory', request);
  return response.data;
}

export async function registerUser(request: RegisterRequest): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/register', request);
  return response.data;
}

export async function loginUser(request: LoginRequest): Promise<AuthResponse> {
  const response = await client.post<AuthResponse>('/auth/login', request);
  return response.data;
}
