import { describe, expect, it } from "vitest";
import { parseJson } from "~/parseJson.js";

describe("parseJson", () => {
    it("should parse valid JSON like JSON.parse", () => {
        const input = JSON.stringify({ a: 1, b: ["x", { c: true }], d: null });
        expect(parseJson(input)).toEqual(JSON.parse(input));
    });

    it.each([
        ["a top-level __proto__ key", '{"__proto__": {"polluted": true}}'],
        ["a nested __proto__ key", '{"a": {"b": {"__proto__": {"polluted": true}}}}'],
        ["a __proto__ key in an array item", '[{"__proto__": {"polluted": true}}]'],
        ["a constructor.prototype key", '{"constructor": {"prototype": {"polluted": true}}}']
    ])("should throw a SyntaxError on %s", (_, input) => {
        expect(() => parseJson(input)).toThrow(SyntaxError);
        expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    });

    it("should throw a SyntaxError on malformed JSON, like JSON.parse", () => {
        expect(() => parseJson("{ not json")).toThrow(SyntaxError);
    });
});
