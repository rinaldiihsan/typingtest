// src/lib/keyboard3d/scene.ts
import {
	AmbientLight,
	CanvasTexture,
	Color,
	DirectionalLight,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	Scene,
	SRGBColorSpace,
	WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { KeyAnimator } from "./animation.ts";
import { boxCorners, fitCameraToPoints } from "./framing.ts";
import { LAYOUT_60, type PlacedKey, placeKeys } from "./layout.ts";

export interface KeyboardScene {
	press(code: string): void;
	release(code: string): void;
	releaseAll(): void;
	dispose(): void;
}

// Tuning knobs. 1 unit = width of a standard key.
const KEY_GAP = 0.08;
const KEY_DEPTH = 0.92;
const KEY_HEIGHT = 0.5;
const KEY_RADIUS = 0.1;
const KEY_REST_Y = 0.16 + KEY_HEIGHT / 2;
const KEY_TRAVEL = 0.14;
const CASE_MARGIN = 0.45;
const CASE_HEIGHT = 0.7;
const BOARD_TILT = 0.07;
const CAMERA_ELEVATION = (50 * Math.PI) / 180;
const CAMERA_FOV = 30;
const FRAME_PADDING = 0.04;
const PRESS_TINT = 0.6;
const AMBIENT_INTENSITY = 1.4;
const SUN_INTENSITY = 2.2;

const ATLAS_COLS = 8;
const ATLAS_ROWS = 8;
const ATLAS_CELL = 128;
const LEGEND_SIZE = 0.8;

interface KeyVisual {
	def: PlacedKey;
	group: Group;
	material: MeshStandardMaterial;
	isModifier: boolean;
	lastDepth: number;
}

function token(
	style: CSSStyleDeclaration,
	name: string,
	fallback: string,
): Color {
	const raw = style.getPropertyValue(name).trim();
	return new Color(raw || fallback);
}

async function loadMonoFont(): Promise<void> {
	if (!("fonts" in document)) return;
	try {
		await Promise.race([
			document.fonts.load('600 48px "Geist Mono"'),
			new Promise((resolve) => setTimeout(resolve, 1500)),
		]);
	} catch {
		// Falls back to the system monospace font.
	}
}

function drawLegendAtlas(labels: string[]): CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = ATLAS_COLS * ATLAS_CELL;
	canvas.height = ATLAS_ROWS * ATLAS_CELL;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("2D canvas is not available");

	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	labels.forEach((label, index) => {
		if (!label) return;
		const col = index % ATLAS_COLS;
		const row = Math.floor(index / ATLAS_COLS);
		const size =
			label.length === 1 ? 76 : Math.min(44, 116 / (label.length * 0.62));
		ctx.font = `600 ${size}px "Geist Mono", ui-monospace, Consolas, monospace`;
		ctx.fillText(
			label,
			col * ATLAS_CELL + ATLAS_CELL / 2,
			row * ATLAS_CELL + ATLAS_CELL / 2 + 4,
		);
	});

	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

function legendGeometry(index: number): PlaneGeometry {
	const geometry = new PlaneGeometry(LEGEND_SIZE, LEGEND_SIZE);
	const col = index % ATLAS_COLS;
	const row = Math.floor(index / ATLAS_COLS);
	const u0 = col / ATLAS_COLS;
	const u1 = (col + 1) / ATLAS_COLS;
	const v1 = 1 - row / ATLAS_ROWS;
	const v0 = 1 - (row + 1) / ATLAS_ROWS;
	const uv = geometry.attributes.uv;
	uv.setXY(0, u0, v1);
	uv.setXY(1, u1, v1);
	uv.setXY(2, u0, v0);
	uv.setXY(3, u1, v0);
	uv.needsUpdate = true;
	return geometry;
}

export async function createKeyboardScene(
	canvas: HTMLCanvasElement,
): Promise<KeyboardScene> {
	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);

	await loadMonoFont();

	const { keys, width: boardWidth, depth: boardDepth } = placeKeys(LAYOUT_60);
	const animator = new KeyAnimator();

	const scene = new Scene();
	const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

	scene.add(new AmbientLight(0xffffff, AMBIENT_INTENSITY));
	const sun = new DirectionalLight(0xffffff, SUN_INTENSITY);
	sun.position.set(-4, 10, 6);
	scene.add(sun);

	const board = new Group();
	board.rotation.x = BOARD_TILT;
	scene.add(board);

	const disposables: { dispose(): void }[] = [];

	const caseGeometry = new RoundedBoxGeometry(
		boardWidth + CASE_MARGIN * 2,
		CASE_HEIGHT,
		boardDepth + CASE_MARGIN * 2,
		3,
		0.25,
	);
	const caseMaterial = new MeshStandardMaterial({ roughness: 0.6 });
	const caseMesh = new Mesh(caseGeometry, caseMaterial);
	caseMesh.position.y = -CASE_HEIGHT / 2;
	board.add(caseMesh);
	disposables.push(caseGeometry, caseMaterial);

	const labels = keys.map((k) => k.label);
	const atlas = drawLegendAtlas(labels);
	const legendMaterial = new MeshBasicMaterial({
		map: atlas,
		transparent: true,
		depthWrite: false,
		polygonOffset: true,
		polygonOffsetFactor: -1,
	});
	disposables.push(atlas, legendMaterial);

	const capGeometries = new Map<number, RoundedBoxGeometry>();
	const visuals: KeyVisual[] = [];
	const visualByCode = new Map<string, KeyVisual>();

	keys.forEach((def, index) => {
		let geometry = capGeometries.get(def.width);
		if (!geometry) {
			geometry = new RoundedBoxGeometry(
				def.width - KEY_GAP,
				KEY_HEIGHT,
				KEY_DEPTH,
				3,
				KEY_RADIUS,
			);
			capGeometries.set(def.width, geometry);
			disposables.push(geometry);
		}

		const material = new MeshStandardMaterial({ roughness: 0.5 });
		disposables.push(material);

		const group = new Group();
		group.position.set(def.x, KEY_REST_Y, def.z);
		group.add(new Mesh(geometry, material));

		if (def.label) {
			const plane = legendGeometry(index);
			disposables.push(plane);
			const legend = new Mesh(plane, legendMaterial);
			legend.rotation.x = -Math.PI / 2;
			legend.position.y = KEY_HEIGHT / 2 + 0.004;
			group.add(legend);
		}

		board.add(group);

		const visual: KeyVisual = {
			def,
			group,
			material,
			isModifier: def.label.length > 1,
			lastDepth: -1,
		};
		visuals.push(visual);
		visualByCode.set(def.code, visual);
	});

	let alphaColor = new Color();
	let modifierColor = new Color();
	let accentColor = new Color();

	function applyPalette(): void {
		const style = getComputedStyle(document.documentElement);
		const bg = token(style, "--bg", "#14181d");
		const fg = token(style, "--fg", "#dfe4ea");
		const surface = token(style, "--surface", "#1f252c");
		accentColor = token(style, "--accent", "#8fa8ff");

		const isDark = bg.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
		// In dark mode the keys pick up a little of the accent so they do not read as flat grey.
		alphaColor = isDark
			? bg.clone().lerp(fg, 0.16).lerp(accentColor, 0.1)
			: bg.clone().lerp(new Color(1, 1, 1), 0.7);
		modifierColor = isDark
			? bg.clone().lerp(fg, 0.08).lerp(accentColor, 0.06)
			: bg.clone().lerp(fg, 0.05);

		caseMaterial.color.copy(surface);
		legendMaterial.color.copy(fg);
		for (const visual of visuals) visual.lastDepth = -1;
		requestRender();
	}

	function syncKeys(): void {
		for (const visual of visuals) {
			const depth = animator.depth(visual.def.code);
			if (depth === visual.lastDepth) continue;
			visual.lastDepth = depth;
			visual.group.position.y = KEY_REST_Y - depth * KEY_TRAVEL;
			visual.material.color
				.copy(visual.isModifier ? modifierColor : alphaColor)
				.lerp(accentColor, depth * PRESS_TINT);
		}
	}

	const frameCorners = boxCorners(
		boardWidth + CASE_MARGIN * 2,
		boardDepth + CASE_MARGIN * 2,
		-CASE_HEIGHT,
		KEY_REST_Y + KEY_HEIGHT / 2,
		BOARD_TILT,
	);

	function fitCamera(): void {
		fitCameraToPoints(camera, frameCorners, {
			elevation: CAMERA_ELEVATION,
			padding: FRAME_PADDING,
		});
	}

	let frameId = 0;
	let lastTime = 0;
	let disposed = false;

	function frame(now: number): void {
		frameId = 0;
		if (disposed) return;

		const dt = lastTime === 0 ? 16 : Math.min(now - lastTime, 50);
		lastTime = now;

		const needsFrame = animator.step(dt);
		syncKeys();
		renderer.render(scene, camera);

		if (needsFrame) {
			frameId = requestAnimationFrame(frame);
		} else {
			lastTime = 0;
		}
	}

	// Render on demand: the loop only runs while a key is moving.
	function requestRender(): void {
		if (frameId === 0 && !disposed) frameId = requestAnimationFrame(frame);
	}

	function resize(): void {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		if (width === 0 || height === 0) return;

		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		fitCamera();
		camera.updateProjectionMatrix();
		requestRender();
	}

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas);

	const themeObserver = new MutationObserver(applyPalette);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
	colorScheme.addEventListener("change", applyPalette);

	applyPalette();
	resize();

	return {
		press(code) {
			if (!visualByCode.has(code)) return;
			animator.press(code);
			requestRender();
		},
		release(code) {
			if (!visualByCode.has(code)) return;
			animator.release(code);
			requestRender();
		},
		releaseAll() {
			animator.releaseAll();
			requestRender();
		},
		dispose() {
			disposed = true;
			if (frameId !== 0) cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			themeObserver.disconnect();
			colorScheme.removeEventListener("change", applyPalette);
			for (const item of disposables) item.dispose();
			renderer.dispose();
		},
	};
}
