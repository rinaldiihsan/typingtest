// src/lib/chart/geometry.ts
import type { Sample } from "#lib/engine/index.ts";

export interface ChartBox {
	width: number;
	height: number;
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export interface ChartGeometry {
	wpmPath: string;
	rawPath: string;
	areaPath: string;
	yTicks: { y: number; label: string }[];
	xTicks: { x: number; label: string }[];
}

const STEP_MULTIPLIERS = [1, 2, 2.5, 5, 10];

/** Smallest "nice" step (1, 2, 2.5, 5 times a power of ten) that is at least `rough`. */
export function niceStep(rough: number): number {
	if (rough <= 0) return 1;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	for (const m of STEP_MULTIPLIERS) {
		if (m * magnitude >= rough) return m * magnitude;
	}
	return 10 * magnitude;
}

function fmt(value: number): string {
	return value.toFixed(1);
}

function line(points: [number, number][]): string {
	return points
		.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`)
		.join(" ");
}

/** Turns samples into SVG paths and axis ticks inside the given box. Needs 2+ samples. */
export function buildChart(
	samples: readonly Sample[],
	box: ChartBox,
): ChartGeometry | null {
	if (samples.length < 2) return null;

	const maxT = Math.max(...samples.map((s) => s.t));
	const maxValue = Math.max(...samples.map((s) => Math.max(s.wpm, s.raw)), 1);
	const yStep = niceStep(maxValue / 3);
	const yMax = yStep * Math.ceil(maxValue / yStep);

	const plotW = box.width - box.left - box.right;
	const plotH = box.height - box.top - box.bottom;
	const x = (t: number) => box.left + (t / maxT) * plotW;
	const y = (v: number) => box.top + plotH - (v / yMax) * plotH;

	const wpmPoints = samples.map((s): [number, number] => [x(s.t), y(s.wpm)]);
	const rawPoints = samples.map((s): [number, number] => [x(s.t), y(s.raw)]);
	const baseline = box.top + plotH;
	const first = wpmPoints[0];
	const last = wpmPoints[wpmPoints.length - 1];

	const yTicks: ChartGeometry["yTicks"] = [];
	for (let v = 0; v <= yMax + 1e-9; v += yStep)
		yTicks.push({ y: y(v), label: String(Math.round(v)) });

	const xStep = Math.max(1, Math.round(niceStep(maxT / 5)));
	const xTicks: ChartGeometry["xTicks"] = [];
	for (let t = 0; t <= maxT + 1e-9; t += xStep)
		xTicks.push({ x: x(t), label: `${t}s` });

	return {
		wpmPath: line(wpmPoints),
		rawPath: line(rawPoints),
		areaPath: `${line(wpmPoints)} L${fmt(last[0])} ${fmt(baseline)} L${fmt(first[0])} ${fmt(baseline)} Z`,
		yTicks,
		xTicks,
	};
}
