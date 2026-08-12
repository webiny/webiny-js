import { describe, expect, it } from "vitest";
import { extractJson } from "./parseJson.js";

describe("extractJson", () => {
    it("parses a bare JSON object", () => {
        expect(extractJson('{ "type": "hero", "confidence": 0.9 }')).toEqual({
            type: "hero",
            confidence: 0.9
        });
    });

    it("parses a fenced JSON block ignoring surrounding prose", () => {
        const text = 'Here you go:\n```json\n{ "name": "Hero" }\n```\nHope that helps.';
        expect(extractJson(text)).toEqual({ name: "Hero" });
    });

    it("parses an object embedded in prose", () => {
        expect(extractJson('The result is { "a": 1 } as requested.')).toEqual({ a: 1 });
    });

    it("returns null when there is no parseable object", () => {
        expect(extractJson("no json here")).toBeNull();
        expect(extractJson("{ not valid json }")).toBeNull();
    });
});
