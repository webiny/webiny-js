import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";
import { FileNormalizer } from "~/features/upload/utils/FileNormalizer.js";

const makeFile = (overrides: { id?: string; key?: string } = {}) => {
    const id = mdbid();
    return {
        id,
        key: `${id}/filename.png`,
        name: "filename.png",
        size: 123456,
        type: "image/png",
        tags: [],
        ...overrides
    };
};

const invalidKeys = [
    "../../../../../../.env",
    "abc/../../other-tenant/files/x.png",
    "/etc/passwd",
    "abc/./x.png",
    "abc//x.png",
    "abc\\..\\x.png",
    "abc/x.png\0"
];

const invalidIds = ["..", ".", "a/b", "..\\x"];

describe("file key validation", () => {
    const { createFile, createFiles } = useGqlHandler();

    it("should create a file with a regular key", async () => {
        const file = makeFile();
        const [response] = await createFile({ data: file });

        expect(response.data.fileManager.createFile.error).toBeNull();
        expect(response.data.fileManager.createFile.data.key).toBe(file.key);
    });

    it.each(invalidKeys)("should reject key %j", async key => {
        const file = makeFile({ key });
        const [response] = await createFile({ data: file });

        expect(response.data.fileManager.createFile).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });

    it.each(invalidIds)("should reject id %j", async id => {
        const key = `${mdbid()}/x.png`;
        const file = makeFile({ id, key });
        const [response] = await createFile({ data: file });

        expect(response.data.fileManager.createFile).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });

    it("should reject a batch that contains an invalid key", async () => {
        const validFile = makeFile();
        const invalidFile = makeFile({ key: "../../../../../../.env" });
        const [response] = await createFiles({ data: [validFile, invalidFile] });

        expect(response.data.fileManager.createFiles).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });
});

describe("upload key validation", () => {
    const normalizer = new FileNormalizer();

    it("should build a key from the id and the file name", async () => {
        const file = await normalizer.normalizeFile({
            id: "abc",
            name: "photo.png",
            type: "image/png",
            size: 100
        });

        expect(file.key).toBe("abc/photo.png");
    });

    it.each([
        { id: "../../other-tenant/files/x" },
        { id: ".." },
        { id: "abc", keyPrefix: "../../other-tenant/files" }
    ])("should reject %j", async input => {
        const result = normalizer.normalizeFile({
            name: "photo.png",
            type: "image/png",
            size: 100,
            ...input
        });

        await expect(result).rejects.toMatchObject({
            code: "FileManager/File/InvalidFileKeyError"
        });
    });
});
