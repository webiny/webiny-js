import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isNonEmptySettings } from "./isNonEmptySettings.js";

describe("isNonEmptySettings", () => {
    it("is false for nothing entered", () => {
        expect(isNonEmptySettings(undefined)).toBe(false);
        expect(isNonEmptySettings(null)).toBe(false);
        expect(isNonEmptySettings({})).toBe(false);
        expect(isNonEmptySettings({ url: "", tags: [], nested: { a: null } })).toBe(false);
    });

    it("is true when any value is entered, also false and 0", () => {
        expect(isNonEmptySettings({ url: "https://x.test" })).toBe(true);
        expect(isNonEmptySettings({ enabled: false })).toBe(true);
        expect(isNonEmptySettings({ timeout: 0 })).toBe(true);
        expect(isNonEmptySettings({ nested: { a: ["x"] } })).toBe(true);
    });
});
