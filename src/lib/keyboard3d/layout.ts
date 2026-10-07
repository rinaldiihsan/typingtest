// src/lib/keyboard3d/layout.ts
export interface KeyDef {
	/** KeyboardEvent.code */
	code: string;
	label: string;
	/** Width in key units (1u = standard key). */
	width: number;
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

function key(code: string, label: string, width = 1): KeyDef {
	return { code, label, width };
}

function letters(chars: string): KeyDef[] {
	return [...chars].map((ch) => key(`Key${ch}`, ch));
}

const DIGITS: KeyDef[] = [..."1234567890"].map((d) => key(`Digit${d}`, d));

/** 60% ANSI: 5 rows, 61 keys, every row 15u wide. */
export const LAYOUT_60: KeyDef[][] = [
	[
		key("Escape", "esc"),
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
		key("ShiftRight", "shift", 2.75),
	],
	[
		key("ControlLeft", "ctrl", 1.25),
		key("MetaLeft", "win", 1.25),
		key("AltLeft", "alt", 1.25),
		key("Space", "", 6.25),
		key("AltRight", "alt", 1.25),
		key("MetaRight", "win", 1.25),
		key("ContextMenu", "menu", 1.25),
		key("ControlRight", "ctrl", 1.25),
	],
];

function rowWidth(row: KeyDef[]): number {
	return row.reduce((sum, k) => sum + k.width, 0);
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
			keys.push({ ...def, x: cursor + def.width / 2 - width / 2, z });
			cursor += def.width;
		}
	});

	return { keys, width, depth };
}
