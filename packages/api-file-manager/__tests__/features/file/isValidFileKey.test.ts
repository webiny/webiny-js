import { describe, it, expect } from "vitest";
import { isValidFileKey } from "~/features/file/shared/isValidFileKey.js";

describe("isValidFileKey", () => {
    it.each([
        ["abc123", "abc123/image.jpg"],
        ["abc123", "abc123/folder/image.jpg"],
        ["abc123", "prefix/abc123/image.jpg"],
        ["abc123", "a/b/abc123/image.jpg"]
    ])("should accept id %s with key %s", (id, key) => {
        expect(isValidFileKey(id, key)).toBe(true);
    });

    it.each([
        ["abc123", "other/image.jpg"],
        ["abc123", "abc123"],
        ["abc123", "image.jpg"],
        ["abc123", "/abc123/image.jpg"],
        ["abc123", "abc123/../victim/image.jpg"],
        ["abc123", "abc123/./image.jpg"],
        ["abc123", "../../../../etc/passwd"],
        ["abc123", "abc123\\..\\victim\\image.jpg"],
        ["abc123", "abc123//image.jpg"],
        ["abc123", "abc123/"],
        ["abc123", "abc123/ .. /image.jpg"],
        ["abc123", "prefix/victim/abc123/x/image.jpg"],
        ["", "abc123/image.jpg"]
    ])("should reject id %s with key %s", (id, key) => {
        expect(isValidFileKey(id, key)).toBe(false);
    });
});
