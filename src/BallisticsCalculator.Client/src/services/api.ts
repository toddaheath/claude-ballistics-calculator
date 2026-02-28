import axios from 'axios';
import type { AuthResponse, Cartridge, CompareRequest, CompareResponse, CustomCartridgeRequest, LoginRequest, MpbrRequest, MpbrResponse, RegisterRequest, TrajectoryRequest, TrajectoryResponse } from '../types';
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

// Handle 401 responses — clear auth state and redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Don't redirect for auth endpoints (login/register failures are expected)
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export async function compareTrajectories(request: CompareRequest): Promise<CompareResponse> {
  if (isDemoMode) {
    // In demo mode, return mock comparison data
    const unit = request.unitSystem === 'meters' ? 'meters' : 'yards';
    return {
      trajectories: request.cartridgeIds.slice(0, 2).map(() => mockTrajectoryData[unit]),
      unitSystem: request.unitSystem,
    };
  }
  const response = await client.post<CompareResponse>('/trajectory/compare', request);
  return response.data;
}

export async function downloadDopeCard(request: TrajectoryRequest): Promise<Blob> {
  if (isDemoMode) {
    // Return a simple mock CSV
    const csv = 'Range,Height,Velocity,Energy,Drop MOA,Drop Mils\n100,0.00,2474,2276,0.00,0.00\n200,0.28,2279,1918,-1.83,-0.53\n';
    return new Blob([csv], { type: 'text/csv' });
  }
  const response = await client.post('/trajectory/dope-card', request, {
    responseType: 'blob',
  });
  return response.data;
}

export async function calculateMpbr(request: MpbrRequest): Promise<MpbrResponse> {
  if (isDemoMode) {
    return {
      mpbrRange: 268,
      optimalZeroRange: 228,
      vitalZoneRadiusInches: 3.0,
      nearZeroCrossing: 25,
      farZeroCrossing: 228,
      cartridgeName: '.308 Win 168gr BTHP Match',
      unitSystem: request.unitSystem,
      dragModel: 'G1',
    };
  }
  const response = await client.post<MpbrResponse>('/trajectory/mpbr', request);
  return response.data;
}

export async function calculateCustomTrajectory(request: CustomCartridgeRequest): Promise<TrajectoryResponse> {
  if (isDemoMode) {
    const unit = request.unitSystem === 'meters' ? 'meters' : 'yards';
    return { ...mockTrajectoryData[unit], cartridgeName: request.name };
  }
  const response = await client.post<TrajectoryResponse>('/trajectory/custom', request);
  return response.data;
}
