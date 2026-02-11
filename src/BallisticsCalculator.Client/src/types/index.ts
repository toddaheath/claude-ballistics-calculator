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
  unitSystem: string;
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
  shotHeightInches: number;
  unitSystem: string;
}
