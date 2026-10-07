// src/lib/audio/keyclick.test.ts
import { describe, expect, it, vi } from "vitest";
import { createKeyClick } from "./keyclick.ts";

function fakeContext(state = "running") {
	const started: number[] = [];
	const context = {
		destination: {},
		sampleRate: 8000,
		state,
		resume: vi.fn(async () => {}),
		close: vi.fn(async () => {}),
		createBuffer: vi.fn((_channels: number, length: number) => ({
			getChannelData: () => new Float32Array(length),
		})),
		createBufferSource: vi.fn(() => ({
			buffer: null as unknown,
			playbackRate: { value: 1 },
			connect: vi.fn(),
			start: () => void started.push(1),
		})),
		createGain: vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() })),
	};
	return { context, started };
}

describe("createKeyClick", () => {
	it("does not create a context until the first play", () => {
		const factory = vi.fn(() => fakeContext().context);
		createKeyClick(factory);
		expect(factory).not.toHaveBeenCalled();
	});

	it("creates the context and buffer once and plays every call", () => {
		const { context, started } = fakeContext();
		const factory = vi.fn(() => context);
		const click = createKeyClick(factory);

		click.play();
		click.play();
		click.play();

		expect(factory).toHaveBeenCalledTimes(1);
		expect(context.createBuffer).toHaveBeenCalledTimes(1);
		expect(started).toHaveLength(3);
	});

	it("resumes a suspended context", () => {
		const { context } = fakeContext("suspended");
		createKeyClick(() => context).play();
		expect(context.resume).toHaveBeenCalled();
	});

	it("does nothing when audio is unsupported", () => {
		const factory = vi.fn(() => null);
		const click = createKeyClick(factory);
		expect(() => click.play()).not.toThrow();
		click.play();
		expect(factory).toHaveBeenCalledTimes(1);
	});

	it("does not throw when the context fails", () => {
		const click = createKeyClick(() => {
			throw new Error("blocked");
		});
		expect(() => click.play()).not.toThrow();
	});

	it("closes the context on dispose", () => {
		const { context } = fakeContext();
		const click = createKeyClick(() => context);
		click.play();
		click.dispose();
		expect(context.close).toHaveBeenCalled();
	});
});
