import { describe, expect, it } from "vitest";
import {
    describeEditorFieldValue,
    isEditorFieldValue
} from "~/features/target/isEditorFieldValue.js";

describe("isEditorFieldValue", () => {
    it.each([
        ["text", "a", true],
        ["text", "", true],
        ["text", 1, false],
        ["text", true, false],
        ["text", ["a"], false],
        ["long-text", "a long text", true],
        ["long-text", {}, false],
        ["number", 3, true],
        ["number", 0, true],
        ["number", -1.5, true],
        ["number", "3", false],
        ["number", Number.NaN, false],
        ["number", Number.POSITIVE_INFINITY, false],
        ["boolean", true, true],
        ["boolean", false, true],
        ["boolean", "true", false],
        ["boolean", 1, false],
        ["datetime", "2024-01-15T10:00:00", true],
        ["datetime", 1705312800000, false],
        ["ref", "x", false],
        ["file", "x", false]
    ])("%s accepts %j: %s", (type, value, expected) => {
        expect(isEditorFieldValue(type, value)).toBe(expected);
    });

    it("accepts null for every writable type, so a required validator decides", () => {
        for (const type of ["text", "long-text", "number", "boolean", "datetime"]) {
            expect(isEditorFieldValue(type, null)).toBe(true);
        }
    });

    it("rejects undefined", () => {
        expect(isEditorFieldValue("text", undefined)).toBe(false);
    });

    it("describes what each writable type expects", () => {
        expect(describeEditorFieldValue("text")).toBe("a string");
        expect(describeEditorFieldValue("long-text")).toBe("a string");
        expect(describeEditorFieldValue("number")).toBe("a number");
        expect(describeEditorFieldValue("boolean")).toBe("true or false");
        expect(describeEditorFieldValue("datetime")).toBe("a date or time string");
    });
});
