import { describe, it, expect } from "vitest";
import { FileNormalizer } from "./FileNormalizer.js";
import { getFileStorageKey } from "./getFileStorageKey.js";

const file = { id: "abc", name: "photo.jpg", type: "image/jpeg", size: 10 };

describe("file keys", () => {
    it.each([
        "/tenants/root/files",
        "../other",
        "a/../b",
        "a/..",
        " ../",
        ".. /x",
        "a/ .. /b",
        "./x",
        "..\\root",
        "  /root"
    ])("should reject key prefix %s", async keyPrefix => {
        await expect(
            new FileNormalizer().normalizeFile({ ...file, keyPrefix })
        ).rejects.toMatchObject({ code: "INVALID_KEY_PREFIX" });
    });

    it("should keep a valid key prefix inside the tenant folder", async () => {
        const normalized = await new FileNormalizer().normalizeFile({
            ...file,
            keyPrefix: "tenants/root/files/folder"
        });

        expect(getFileStorageKey("other", normalized.key)).toBe(
            "tenants/other/files/tenants/root/files/folder/abc/photo.jpg"
        );
    });

    it("should trim the key prefix", async () => {
        const normalized = await new FileNormalizer().normalizeFile({
            ...file,
            keyPrefix: "  folder  "
        });
        expect(normalized.key).toBe("folder/abc/photo.jpg");
    });
});
