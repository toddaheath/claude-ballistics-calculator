import axios from 'axios';
import type { Cartridge, TrajectoryRequest, TrajectoryResponse } from '../types';
import { mockCartridges, mockTrajectoryData } from './mockData';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
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
