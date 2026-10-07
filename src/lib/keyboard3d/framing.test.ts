// src/lib/keyboard3d/framing.test.ts
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { boxCorners, fitCameraToPoints } from './framing.ts';

const OPTIONS = { elevation: (50 * Math.PI) / 180, padding: 0.04 };

function extents(camera: PerspectiveCamera, points: Vector3[]) {
  let x = 0;
  let y = 0;
  for (const point of points) {
    const p = point.clone().project(camera);
    x = Math.max(x, Math.abs(p.x));
    y = Math.max(y, Math.abs(p.y));
  }
  return { x, y };
}

describe('fitCameraToPoints', () => {
  const corners = boxCorners(15.9, 5.9, -0.7, 0.9, 0.07);

  for (const aspect of [1.2, 2, 16 / 6, 3.5]) {
    it(`keeps every corner inside the frame at aspect ${aspect.toFixed(2)}`, () => {
      const camera = new PerspectiveCamera(30, aspect, 0.1, 100);
      fitCameraToPoints(camera, corners, OPTIONS);
      const { x, y } = extents(camera, corners);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(1);
    });
  }

  it('fills the frame instead of leaving it mostly empty', () => {
    const camera = new PerspectiveCamera(30, 16 / 6, 0.1, 100);
    fitCameraToPoints(camera, corners, OPTIONS);
    const { x, y } = extents(camera, corners);
    expect(Math.max(x, y)).toBeGreaterThan(0.9);
  });

  it('moves the camera further away for a narrower frame', () => {
    const wide = new PerspectiveCamera(30, 3, 0.1, 100);
    const narrow = new PerspectiveCamera(30, 1.5, 0.1, 100);
    const wideDistance = fitCameraToPoints(wide, corners, OPTIONS);
    const narrowDistance = fitCameraToPoints(narrow, corners, OPTIONS);
    expect(narrowDistance).toBeGreaterThan(wideDistance);
  });
});

describe('boxCorners', () => {
  it('returns 8 corners', () => {
    expect(boxCorners(2, 2, 0, 1, 0)).toHaveLength(8);
  });
});
