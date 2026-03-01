import { describe, it, expect } from 'vitest';
import { mockCartridges, mockTrajectoryData } from '../mockData';

describe('mockCartridges', () => {
  it('contains 10 cartridges', () => {
    expect(mockCartridges).toHaveLength(10);
  });

  it('has all required fields on each cartridge', () => {
    for (const c of mockCartridges) {
      expect(c.id).toBeGreaterThan(0);
      expect(c.name).toBeTruthy();
      expect(c.category).toBeTruthy();
      expect(c.bulletType).toBeTruthy();
      expect(c.bulletWeightGrains).toBeGreaterThan(0);
      expect(c.muzzleVelocityFps).toBeGreaterThan(0);
      expect(c.ballisticCoefficientG1).toBeGreaterThan(0);
    }
  });

  it('includes all four categories', () => {
    const categories = new Set(mockCartridges.map(c => c.category));
    expect(categories).toContain('Handgun');
    expect(categories).toContain('Intermediate');
    expect(categories).toContain('Standard Rifle');
    expect(categories).toContain('Magnum');
  });

  it('has unique IDs', () => {
    const ids = mockCartridges.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('mockTrajectoryData', () => {
  it('has both yards and meters entries', () => {
    expect(mockTrajectoryData).toHaveProperty('yards');
    expect(mockTrajectoryData).toHaveProperty('meters');
  });

  it('yards trajectory has correct unit system', () => {
    expect(mockTrajectoryData.yards.unitSystem).toBe('yards');
  });

  it('meters trajectory has correct unit system', () => {
    expect(mockTrajectoryData.meters.unitSystem).toBe('meters');
  });

  it('yards trajectory has 21 points (0 to 500 in 25-yard steps)', () => {
    expect(mockTrajectoryData.yards.points).toHaveLength(21);
    expect(mockTrajectoryData.yards.points[0].range).toBe(0);
    expect(mockTrajectoryData.yards.points[20].range).toBe(500);
  });

  it('velocity decreases with range', () => {
    const points = mockTrajectoryData.yards.points;
    for (let i = 1; i < points.length; i++) {
      expect(points[i].velocity).toBeLessThanOrEqual(points[i - 1].velocity);
    }
  });

  it('time of flight increases with range', () => {
    const points = mockTrajectoryData.yards.points;
    for (let i = 1; i < points.length; i++) {
      expect(points[i].timeOfFlight).toBeGreaterThanOrEqual(points[i - 1].timeOfFlight);
    }
  });

  it('zero range is 100 for yards data', () => {
    expect(mockTrajectoryData.yards.zeroRange).toBe(100);
  });

  it('drag model defaults to G1', () => {
    expect(mockTrajectoryData.yards.dragModel).toBe('G1');
    expect(mockTrajectoryData.meters.dragModel).toBe('G1');
  });
});
