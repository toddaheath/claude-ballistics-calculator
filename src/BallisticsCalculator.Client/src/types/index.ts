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
  windDriftInches: number;
  dropMoa: number;
  dropMils: number;
  windDriftMoa: number;
  windDriftMils: number;
  isTransonic: boolean;
}

export interface TrajectoryRequest {
  cartridgeId: number;
  zeroRange?: number;
  maxRange?: number;
  unitSystem: UnitSystem;
  shotHeightInches?: number;
  sightHeightInches?: number;
  windSpeedMph?: number;
  windDirectionDeg?: number;
  temperatureF?: number;
  altitudeFt?: number;
  pressureInHg?: number;
  humidityPercent?: number;
  shootingAngleDeg?: number;
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
  transonicRange: number;
}

export interface EnvironmentSettings {
  windSpeedMph: number;
  windDirectionDeg: number;
  temperatureF: number;
  altitudeFt: number;
  pressureInHg: number;
  humidityPercent: number;
  zeroRange: number;
  sightHeightInches: number;
  shotHeightInches: number;
  shootingAngleDeg: number;
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
