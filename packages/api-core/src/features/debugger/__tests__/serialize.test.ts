import { describe, expect, it } from "vitest";
import { serialize } from "../serialize.js";
import { DEFAULT_LIMITS, type IDebuggerLimits } from "../limits.js";

const limits = (overrides: Partial<IDebuggerLimits> = {}): IDebuggerLimits => {
    return { ...DEFAULT_LIMITS, ...overrides };
};

const parse = (value: unknown, overrides: Partial<IDebuggerLimits> = {}) => {
    const result = serialize(value, limits(overrides));
    return { ...result, parsed: JSON.parse(result.json) };
};

describe("serialize", () => {
    it("should always produce parseable JSON", () => {
        const circular: Record<string, unknown> = { name: "root" };
        circular.self = circular;

        const { parsed } = parse(circular);

        expect(parsed).toEqual({ name: "root", self: "#[Circular]" });
    });

    it("should not report siblings as circular", () => {
        const shared = { id: 1 };

        const { parsed } = parse({ a: shared, b: shared });

        expect(parsed).toEqual({ a: { id: 1 }, b: { id: 1 } });
    });

    it("should serialize an Error, which JSON.stringify renders as an empty object", () => {
        const error = new Error("Boom");

        const { parsed } = parse({ error });

        expect(parsed.error.name).toBe("Error");
        expect(parsed.error.message).toBe("Boom");
        expect(typeof parsed.error.stack).toBe("string");
    });

    it("should serialize a BigInt, which JSON.stringify throws on", () => {
        const { parsed } = parse({ value: BigInt(123) });

        expect(parsed).toEqual({ value: "123n" });
    });

    it("should describe binary data without including its contents", () => {
        const { parsed } = parse({ buffer: Buffer.from("hello world") });

        expect(parsed).toEqual({ buffer: "#[Buffer 11 bytes]" });
    });

    it("should serialize Map and Set", () => {
        const { parsed } = parse({
            map: new Map([["a", 1]]),
            set: new Set([1, 2])
        });

        expect(parsed.map).toEqual({ __type: "Map", entries: [["a", 1]] });
        expect(parsed.set).toEqual({ __type: "Set", items: [1, 2] });
    });

    it("should drop an undefined property, so a logged payload matches what was sent", () => {
        const { parsed } = parse({ kept: 1, dropped: undefined });

        expect(parsed).toEqual({ kept: 1 });
    });

    it("should keep undefined array elements, where dropping would shift every later index", () => {
        const { parsed } = parse({ items: [1, undefined, 3] });

        expect(parsed).toEqual({ items: [1, "#[Undefined value]", 3] });
    });

    it("should not throw when a getter throws", () => {
        const value = {
            get exploding() {
                throw new Error("Nope");
            },
            safe: 1
        };

        const { parsed } = parse(value);

        expect(parsed.exploding).toBe("#[Throws: Nope]");
        expect(parsed.safe).toBe(1);
    });

    it("should cap depth", () => {
        const { parsed } = parse({ a: { b: { c: { d: "deep" } } } }, { depth: 2 });

        expect(parsed).toEqual({ a: { b: "#[Depth limit]" } });
    });

    it("should cap string length and say how much was cut", () => {
        const { parsed } = parse({ text: "x".repeat(20) }, { stringLength: 5 });

        expect(parsed).toEqual({ text: "xxxxx…(15 more)" });
    });

    it("should cap array length and say how much was cut", () => {
        const { parsed } = parse({ items: [1, 2, 3, 4, 5] }, { arrayLength: 2 });

        expect(parsed).toEqual({ items: [1, 2, "…(3 more items)"] });
    });

    it("should replace the payload wholesale when it exceeds the per-entry cap", () => {
        const result = parse({ text: "x".repeat(5000) }, { entryBytes: 100, stringLength: 100000 });

        expect(result.truncated).toBe(true);
        expect(result.parsed.truncated).toBe(true);
        expect(result.parsed.originalBytes).toBeGreaterThan(100);
        expect(result.bytes).toBeLessThanOrEqual(100);
    });

    it("should never invoke a custom toJSON, so it cannot be broken by one", () => {
        const value = {
            id: 1,
            toJSON() {
                throw new Error("Nope");
            }
        };

        const { parsed } = parse({ value });

        expect(parsed.value.id).toBe(1);
        expect(parsed.value.toJSON).toBe("#[Function: toJSON]");
    });

    it("should keep non-finite numbers readable instead of turning them into null", () => {
        const { parsed } = parse({ a: Infinity, b: NaN });

        expect(parsed).toEqual({ a: "Infinity", b: "NaN" });
    });
});
