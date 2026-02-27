export type UnitSystem = 'yards' | 'meters';

export interface Cartridge {
  id: number;
  name: string;
  category: string;
  bulletType: string;
  bulletWeightGrains: number;
  muzzleVelocityFps: number;
  ballisticCoefficientG1: number;
}

export interface TrajectoryPoint {
  range: number;
  height: number;
  velocity: number;
  energy: number;
  timeOfFlight: number;
  mach: number;
  drop: number;
}

export interface TrajectoryRequest {
  cartridgeId: number;
  zeroRange?: number;
  maxRange?: number;
  unitSystem: UnitSystem;
  shotHeightInches?: number;
}

export interface TrajectoryResponse {
  points: TrajectoryPoint[];
  zeroRange: number;
  muzzleVelocity: number;
  maxRange: number;
  cartridgeName: string;
  boreElevationAngleMOA: number;
  heightAt50: number;
  secondCrossingRange: number;
  shotHeight: number;
  unitSystem: UnitSystem;
}

export interface AuthUser {
  userId: number;
  email: string;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  userId: number;
}
