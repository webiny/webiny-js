import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isValidObjectKey } from "~/isValidObjectKey.js";

describe("isValidObjectKey", () => {
    it("accepts a relative, /-separated path", () => {
        expect(isValidObjectKey("tenants/root/files/abc/photo.png")).toBe(true);
    });

    it("refuses keys that could climb out of a folder or prefix", () => {
        const keys = ["", "/a", "a/", "a//b", "./a", "a/../b", "..", "a\\b"];

        for (const key of keys) {
            expect(isValidObjectKey(key)).toBe(false);
        }
    });
});
