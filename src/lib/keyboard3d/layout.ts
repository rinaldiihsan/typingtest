// src/lib/keyboard3d/layout.ts
export interface KeyDef {
	/** KeyboardEvent.code */
	code: string;
	label: string;
	/** Width in key units (1u = standard key). */
	width: number;
	/** Empty space before the key, in key units. */
	gap?: number;
}

export interface PlacedKey extends KeyDef {
	/** Key center in key units, origin at the board center. */
	x: number;
	z: number;
}

export interface PlacedLayout {
	keys: PlacedKey[];
	width: number;
	depth: number;
}

export type LayoutName = "60" | "75" | "tkl";

export const LAYOUT_NAMES: readonly LayoutName[] = ["60", "75", "tkl"];

function key(code: string, label: string, width = 1, gap = 0): KeyDef {
	return gap > 0 ? { code, label, width, gap } : { code, label, width };
}

function letters(chars: string): KeyDef[] {
	return [...chars].map((ch) => key(`Key${ch}`, ch));
}

function fKeys(from: number, to: number): KeyDef[] {
	const keys: KeyDef[] = [];
	for (let n = from; n <= to; n++) keys.push(key(`F${n}`, `F${n}`));
	return keys;
}

const DIGITS: KeyDef[] = [..."1234567890"].map((d) => key(`Digit${d}`, d));

/** Rows 1 to 4 of the main block, shared by every layout. Row 0 and the bottom row differ. */
function mainRows(options: {
	shiftRight: number;
	ctrlRow: KeyDef[];
}): KeyDef[][] {
	return [
		[
			key("Backquote", "`"),
			...DIGITS,
			key("Minus", "-"),
			key("Equal", "="),
			key("Backspace", "bksp", 2),
		],
		[
			key("Tab", "tab", 1.5),
			...letters("QWERTYUIOP"),
			key("BracketLeft", "["),
			key("BracketRight", "]"),
			key("Backslash", "\\", 1.5),
		],
		[
			key("CapsLock", "caps", 1.75),
			...letters("ASDFGHJKL"),
			key("Semicolon", ";"),
			key("Quote", "'"),
			key("Enter", "enter", 2.25),
		],
		[
			key("ShiftLeft", "shift", 2.25),
			...letters("ZXCVBNM"),
			key("Comma", ","),
			key("Period", "."),
			key("Slash", "/"),
			key("ShiftRight", "shift", options.shiftRight),
		],
		[...options.ctrlRow],
	];
}

const CTRL_ROW_FULL: KeyDef[] = [
	key("ControlLeft", "ctrl", 1.25),
	key("MetaLeft", "win", 1.25),
	key("AltLeft", "alt", 1.25),
	key("Space", "", 6.25),
	key("AltRight", "alt", 1.25),
	key("MetaRight", "win", 1.25),
	key("ContextMenu", "menu", 1.25),
	key("ControlRight", "ctrl", 1.25),
];

/** 60% ANSI: 5 rows, 61 keys, every row 15u wide. */
export const LAYOUT_60: KeyDef[][] = (() => {
	const rows = mainRows({ shiftRight: 2.75, ctrlRow: CTRL_ROW_FULL });
	// The 60% has Esc where the grave accent key would be.
	rows[0][0] = key("Escape", "esc");
	return rows;
})();

/** 75%: function row plus a right column and arrow keys, 16u wide, 6 rows. */
export const LAYOUT_75: KeyDef[][] = (() => {
	const rows = mainRows({
		shiftRight: 1.75,
		ctrlRow: [
			key("ControlLeft", "ctrl", 1.25),
			key("MetaLeft", "win", 1.25),
			key("AltLeft", "alt", 1.25),
			key("Space", "", 6.25),
			key("AltRight", "alt"),
			key("ControlRight", "ctrl"),
			key("ArrowLeft", "left", 1, 1),
			key("ArrowDown", "down"),
			key("ArrowRight", "right"),
		],
	});
	rows[0].push(key("Home", "home"));
	rows[1].push(key("PageUp", "pgup"));
	rows[2].push(key("PageDown", "pgdn"));
	rows[3].push(key("ArrowUp", "up"), key("End", "end"));
	return [
		[
			key("Escape", "esc"),
			...fKeys(1, 12),
			key("PrintScreen", "prt"),
			key("Insert", "ins"),
			key("Delete", "del"),
		],
		...rows,
	];
})();

/** Tenkeyless: full main block, navigation cluster and arrows, 6 rows. */
export const LAYOUT_TKL: KeyDef[][] = (() => {
	const rows = mainRows({ shiftRight: 2.75, ctrlRow: CTRL_ROW_FULL });
	rows[0].push(
		key("Insert", "ins", 1, 0.25),
		key("Home", "home"),
		key("PageUp", "pgup"),
	);
	rows[1].push(
		key("Delete", "del", 1, 0.25),
		key("End", "end"),
		key("PageDown", "pgdn"),
	);
	rows[3].push(key("ArrowUp", "up", 1, 1.25));
	rows[4].push(
		key("ArrowLeft", "left", 1, 0.25),
		key("ArrowDown", "down"),
		key("ArrowRight", "right"),
	);
	return [
		[
			key("Escape", "esc"),
			...fKeys(1, 4).map((k, i) => (i === 0 ? { ...k, gap: 1 } : k)),
			...fKeys(5, 8).map((k, i) => (i === 0 ? { ...k, gap: 0.5 } : k)),
			...fKeys(9, 12).map((k, i) => (i === 0 ? { ...k, gap: 0.5 } : k)),
			key("PrintScreen", "prt", 1, 0.25),
			key("ScrollLock", "scr"),
			key("Pause", "pause"),
		],
		...rows,
	];
})();

export interface LayoutInfo {
	name: LayoutName;
	label: string;
	rows: KeyDef[][];
}

export const LAYOUTS: Record<LayoutName, LayoutInfo> = {
	"60": { name: "60", label: "60%", rows: LAYOUT_60 },
	"75": { name: "75", label: "75%", rows: LAYOUT_75 },
	tkl: { name: "tkl", label: "TKL", rows: LAYOUT_TKL },
};

function rowWidth(row: KeyDef[]): number {
	return row.reduce((sum, k) => sum + (k.gap ?? 0) + k.width, 0);
}

/** Turns rows of keys into centered positions. Row 0 is at the back (negative z). */
export function placeKeys(layout: KeyDef[][]): PlacedLayout {
	const width = Math.max(...layout.map(rowWidth));
	const depth = layout.length;
	const keys: PlacedKey[] = [];

	layout.forEach((row, rowIndex) => {
		let cursor = 0;
		const z = rowIndex - (depth - 1) / 2;
		for (const def of row) {
			cursor += def.gap ?? 0;
			keys.push({ ...def, x: cursor + def.width / 2 - width / 2, z });
			cursor += def.width;
		}
	});

	return { keys, width, depth };
}
