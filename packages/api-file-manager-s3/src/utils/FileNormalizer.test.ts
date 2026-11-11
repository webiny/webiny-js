import { describe, it, expect } from "vitest";
import { FileNormalizer } from "@webiny/api-file-manager/features/upload/utils/FileNormalizer.js";
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

    it.each([
        "victimId/optimized",
        "../../other/files/victim",
        "abc/..",
        "-abc",
        "abc-",
        "ab",
        "a b c",
        "abc.def",
        "abc\\def"
    ])("should reject file id %s", async id => {
        await expect(new FileNormalizer().normalizeFile({ ...file, id })).rejects.toMatchObject({
            code: "INVALID_FILE_ID"
        });
    });

    it.each(["abc", "68f0a1b2c3d4e5f6a7b8c9d0", "file-src-test", "A1-b2"])(
        "should accept file id %s",
        async id => {
            const normalized = await new FileNormalizer().normalizeFile({ ...file, id });
            expect(normalized.id).toBe(id);
            expect(normalized.key).toBe(`${id}/photo.jpg`);
        }
    );

    it("should generate a file id when none is given", async () => {
        const normalized = await new FileNormalizer().normalizeFile({
            name: "photo.jpg",
            type: "image/jpeg",
            size: 10
        });
        expect(normalized.id).toMatch(/^([a-zA-Z0-9])([a-zA-Z0-9-]+)([a-zA-Z0-9])$/);
        expect(normalized.key).toBe(`${normalized.id}/photo.jpg`);
    });

    it("should trim the key prefix", async () => {
        const normalized = await new FileNormalizer().normalizeFile({
            ...file,
            keyPrefix: "  folder  "
        });
        expect(normalized.key).toBe("folder/abc/photo.jpg");
    });
});
