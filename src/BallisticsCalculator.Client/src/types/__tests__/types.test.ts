import { describe, it, expect } from 'vitest';
import type {
  Cartridge, TrajectoryPoint, TrajectoryRequest,
  EnvironmentSettings, CompareRequest, CompareResponse,
  MpbrRequest, MpbrResponse, CustomCartridgeRequest
} from '../index';

describe('TypeScript types', () => {
  it('Cartridge type has correct shape', () => {
    const cartridge: Cartridge = {
      id: 1,
      name: 'Test',
      category: 'Handgun',
      bulletType: 'FMJ',
      bulletWeightGrains: 124,
      muzzleVelocityFps: 1150,
      ballisticCoefficientG1: 0.135,
    };
    expect(cartridge.id).toBe(1);
    expect(cartridge.name).toBe('Test');
  });

  it('TrajectoryPoint has all fields', () => {
    const point: TrajectoryPoint = {
      range: 100,
      height: 0,
      velocity: 2474,
      energy: 2276,
      timeOfFlight: 0.119,
      mach: 2.21,
      drop: -5.5,
      windDriftInches: 0,
      dropMoa: 0,
      dropMils: 0,
      windDriftMoa: 0,
      windDriftMils: 0,
      isTransonic: false,
    };
    expect(point.range).toBe(100);
    expect(point.isTransonic).toBe(false);
  });

  it('TrajectoryRequest accepts all optional fields', () => {
    const request: TrajectoryRequest = {
      cartridgeId: 29,
      unitSystem: 'yards',
      zeroRange: 100,
      maxRange: 500,
      shotHeightInches: 30,
      sightHeightInches: 1.5,
      windSpeedMph: 10,
      windDirectionDeg: 90,
      temperatureF: 59,
      altitudeFt: 0,
      pressureInHg: 29.92,
      humidityPercent: 0,
      shootingAngleDeg: 0,
      dragModel: 'G1',
    };
    expect(request.cartridgeId).toBe(29);
    expect(request.dragModel).toBe('G1');
  });

  it('EnvironmentSettings has all required fields', () => {
    const settings: EnvironmentSettings = {
      windSpeedMph: 0,
      windDirectionDeg: 90,
      temperatureF: 59,
      altitudeFt: 0,
      pressureInHg: 29.92,
      humidityPercent: 0,
      zeroRange: 100,
      sightHeightInches: 1.5,
      shotHeightInches: 30,
      shootingAngleDeg: 0,
      dragModel: 'G1',
    };
    expect(settings.zeroRange).toBe(100);
  });

  it('CompareRequest accepts cartridge IDs array', () => {
    const request: CompareRequest = {
      cartridgeIds: [29, 21],
      unitSystem: 'yards',
    };
    expect(request.cartridgeIds).toHaveLength(2);
  });

  it('CompareResponse has trajectories array', () => {
    const response: CompareResponse = {
      trajectories: [],
      unitSystem: 'yards',
    };
    expect(response.trajectories).toEqual([]);
  });

  it('MpbrRequest accepts optional fields', () => {
    const request: MpbrRequest = {
      cartridgeId: 29,
      unitSystem: 'yards',
      vitalZoneRadiusInches: 3,
      sightHeightInches: 1.5,
      dragModel: 'G7',
    };
    expect(request.dragModel).toBe('G7');
  });

  it('MpbrResponse has all range fields', () => {
    const response: MpbrResponse = {
      mpbrRange: 268,
      optimalZeroRange: 228,
      vitalZoneRadiusInches: 3,
      nearZeroCrossing: 25,
      farZeroCrossing: 228,
      cartridgeName: '.308 Win',
      unitSystem: 'yards',
      dragModel: 'G1',
    };
    expect(response.mpbrRange).toBe(268);
    expect(response.farZeroCrossing).toBeGreaterThan(response.nearZeroCrossing);
  });

  it('CustomCartridgeRequest accepts bullet parameters', () => {
    const request: CustomCartridgeRequest = {
      name: 'Custom Load',
      bulletWeightGrains: 168,
      muzzleVelocityFps: 2680,
      ballisticCoefficient: 0.462,
      unitSystem: 'yards',
    };
    expect(request.name).toBe('Custom Load');
  });
});
