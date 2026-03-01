import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// We'll test the module by importing it after setting up env vars
// But first, let's test the exported functions in demo mode and normal mode

describe('API service', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...import.meta.env };
    vi.resetModules();
  });

  afterEach(() => {
    // Restore env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('demo mode', () => {
    beforeEach(() => {
      import.meta.env.VITE_DEMO_MODE = 'true';
    });

    it('getCartridges returns mock data', async () => {
      const { getCartridges } = await import('../api');
      const cartridges = await getCartridges();
      expect(cartridges.length).toBeGreaterThan(0);
      expect(cartridges[0]).toHaveProperty('name');
      expect(cartridges[0]).toHaveProperty('id');
    });

    it('calculateTrajectory returns mock data for yards', async () => {
      const { calculateTrajectory } = await import('../api');
      const result = await calculateTrajectory({
        cartridgeId: 1,
        unitSystem: 'yards',
      });
      expect(result.unitSystem).toBe('yards');
      expect(result.points.length).toBeGreaterThan(0);
    });

    it('calculateTrajectory returns mock data for meters', async () => {
      const { calculateTrajectory } = await import('../api');
      const result = await calculateTrajectory({
        cartridgeId: 1,
        unitSystem: 'meters',
      });
      expect(result.unitSystem).toBe('meters');
    });

    it('compareTrajectories returns mock comparison', async () => {
      const { compareTrajectories } = await import('../api');
      const result = await compareTrajectories({
        cartridgeIds: [1, 2],
        unitSystem: 'yards',
      });
      expect(result.trajectories.length).toBe(2);
      expect(result.unitSystem).toBe('yards');
    });

    it('downloadDopeCard returns a CSV blob', async () => {
      const { downloadDopeCard } = await import('../api');
      const blob = await downloadDopeCard({
        cartridgeId: 1,
        unitSystem: 'yards',
      });
      expect(blob).toBeInstanceOf(Blob);
      const text = await blob.text();
      expect(text).toContain('Range');
    });

    it('calculateMpbr returns mock MPBR data', async () => {
      const { calculateMpbr } = await import('../api');
      const result = await calculateMpbr({
        cartridgeId: 29,
        unitSystem: 'yards',
      });
      expect(result.mpbrRange).toBe(268);
      expect(result.optimalZeroRange).toBe(228);
    });

    it('calculateCustomTrajectory returns mock with custom name', async () => {
      const { calculateCustomTrajectory } = await import('../api');
      const result = await calculateCustomTrajectory({
        name: 'My Custom Load',
        bulletWeightGrains: 168,
        muzzleVelocityFps: 2680,
        ballisticCoefficient: 0.462,
        unitSystem: 'yards',
      });
      expect(result.cartridgeName).toBe('My Custom Load');
    });
  });

  describe('axios interceptors', () => {
    it('request interceptor adds auth token from localStorage', async () => {
      import.meta.env.VITE_DEMO_MODE = 'false';

      // Set up localStorage mock
      const storageMock: Record<string, string> = { auth_token: 'test-jwt-token' };
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => storageMock[key] ?? null),
          setItem: vi.fn(),
          removeItem: vi.fn((key: string) => { delete storageMock[key]; }),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const { client } = await import('../api');

      // Manually run the request interceptor by finding it
      // The interceptor modifies the config to add the Authorization header
      const config: InternalAxiosRequestConfig = {
        headers: new axios.AxiosHeaders(),
      } as InternalAxiosRequestConfig;

      // Get the interceptor handler - it's the first request interceptor
      const interceptors = (client.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }>;
      }).handlers;

      const result = interceptors[0].fulfilled(config);
      expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
    });

    it('request interceptor does not add auth when no token', async () => {
      import.meta.env.VITE_DEMO_MODE = 'false';

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          length: 0,
          key: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const { client } = await import('../api');

      const config: InternalAxiosRequestConfig = {
        headers: new axios.AxiosHeaders(),
      } as InternalAxiosRequestConfig;

      const interceptors = (client.interceptors.request as unknown as {
        handlers: Array<{ fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }>;
      }).handlers;

      const result = interceptors[0].fulfilled(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
