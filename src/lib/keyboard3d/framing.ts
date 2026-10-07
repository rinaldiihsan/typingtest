// src/lib/keyboard3d/framing.ts
import { type PerspectiveCamera, Vector3 } from "three";

export interface FitOptions {
	/** Elevation of the camera above the board plane, in radians. */
	elevation: number;
	/** Fraction of the view kept free around the board (0.04 = 4%). */
	padding: number;
}

/** Largest absolute NDC coordinate (x or y) of the points as seen from the camera. */
function maxExtent(
	camera: PerspectiveCamera,
	points: Vector3[],
	distance: number,
	elevation: number,
) {
	camera.position.set(
		0,
		Math.sin(elevation) * distance,
		Math.cos(elevation) * distance,
	);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	camera.updateProjectionMatrix();

	let max = 0;
	const p = new Vector3();
	for (const point of points) {
		p.copy(point).project(camera);
		max = Math.max(max, Math.abs(p.x), Math.abs(p.y));
	}
	return max;
}

/**
 * Moves the camera along its view ray until every point fits the frame.
 * Uses real perspective projection, so near edges are not underestimated.
 */
export function fitCameraToPoints(
	camera: PerspectiveCamera,
	points: Vector3[],
	{ elevation, padding }: FitOptions,
): number {
	const limit = 1 - padding;
	let near = 1;
	let far = 400;

	for (let i = 0; i < 40; i++) {
		const mid = (near + far) / 2;
		if (maxExtent(camera, points, mid, elevation) > limit) near = mid;
		else far = mid;
	}

	maxExtent(camera, points, far, elevation);
	return far;
}

/** The 8 corners of a box centered on x/z, spanning yMin..yMax, tilted around the X axis. */
export function boxCorners(
	width: number,
	depth: number,
	yMin: number,
	yMax: number,
	tilt: number,
): Vector3[] {
	const corners: Vector3[] = [];
	for (const sx of [-1, 1]) {
		for (const y of [yMin, yMax]) {
			for (const sz of [-1, 1]) {
				const v = new Vector3((sx * width) / 2, y, (sz * depth) / 2);
				v.applyAxisAngle(new Vector3(1, 0, 0), tilt);
				corners.push(v);
			}
		}
	}
	return corners;
}
