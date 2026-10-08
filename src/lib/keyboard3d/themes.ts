// src/lib/keyboard3d/themes.ts
// Plain data, no three.js import, so the UI can use it without loading the 3D chunk.

export type KeycapId = "default" | "graphite" | "sakura" | "ocean" | "retro";

export const KEYCAP_IDS: readonly KeycapId[] = [
	"default",
	"graphite",
	"sakura",
	"ocean",
	"retro",
];

export interface KeycapScheme {
	id: KeycapId;
	label: string;
	/** Two colors for the swatch preview: alpha keys and modifier keys. */
	swatch: [string, string];
	/** Fixed colors. Null means "derive from the current theme". */
	colors: {
		alpha: string;
		modifier: string;
		legend: string;
		case: string;
		/** Color a key is tinted toward while pressed. */
		press: string;
	} | null;
}

export const KEYCAP_SCHEMES: Record<KeycapId, KeycapScheme> = {
	default: {
		id: "default",
		label: "Theme",
		swatch: ["var(--surface)", "var(--accent)"],
		colors: null,
	},
	graphite: {
		id: "graphite",
		label: "Graphite",
		swatch: ["#3a3d45", "#22242a"],
		colors: {
			alpha: "#3a3d45",
			modifier: "#25272d",
			legend: "#e8e9ed",
			case: "#14151a",
			press: "#ffb454",
		},
	},
	sakura: {
		id: "sakura",
		label: "Sakura",
		swatch: ["#f8e1e8", "#e8a9bc"],
		colors: {
			alpha: "#f8e1e8",
			modifier: "#e8a9bc",
			legend: "#5b3342",
			case: "#c98aa0",
			press: "#ff4f8b",
		},
	},
	ocean: {
		id: "ocean",
		label: "Ocean",
		swatch: ["#d6eaf4", "#6fb0cf"],
		colors: {
			alpha: "#d6eaf4",
			modifier: "#6fb0cf",
			legend: "#10364b",
			case: "#2f6f95",
			press: "#00a6e0",
		},
	},
	retro: {
		id: "retro",
		label: "Retro",
		swatch: ["#e5dcc6", "#b7aa8c"],
		colors: {
			alpha: "#e5dcc6",
			modifier: "#b7aa8c",
			legend: "#3a352a",
			case: "#8b8370",
			press: "#d9482b",
		},
	},
};
