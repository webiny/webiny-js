import { describe, expect, it } from "vitest";
import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";

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
        const [response] = await createFile({ data: makeFile({ key }) });

        expect(response.data.fileManager.createFile).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });

    it.each(invalidIds)("should reject id %j", async id => {
        const [response] = await createFile({ data: makeFile({ id, key: `${mdbid()}/x.png` }) });

        expect(response.data.fileManager.createFile).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });

    it("should reject a batch that contains an invalid key", async () => {
        const [response] = await createFiles({
            data: [makeFile(), makeFile({ key: "../../../../../../.env" })]
        });

        expect(response.data.fileManager.createFiles).toMatchObject({
            data: null,
            error: { code: "FileManager/File/InvalidFileKeyError" }
        });
    });
});
