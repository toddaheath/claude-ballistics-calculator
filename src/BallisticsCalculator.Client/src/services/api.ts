import axios from 'axios';
import { Cartridge, TrajectoryRequest, TrajectoryResponse } from '../types';

const client = axios.create({
  baseURL: '/api',
});

export async function getCartridges(): Promise<Cartridge[]> {
  const response = await client.get<Cartridge[]>('/cartridges');
  return response.data;
}

export async function calculateTrajectory(request: TrajectoryRequest): Promise<TrajectoryResponse> {
  const response = await client.post<TrajectoryResponse>('/trajectory', request);
  return response.data;
}
