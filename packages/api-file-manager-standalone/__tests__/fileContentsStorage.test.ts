import { existsSync } from "node:fs";
import { open, readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiskFileContentsStorage } from "~/features/FileContentsStorage/DiskFileContentsStorage.js";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import {
    cleanupStorage,
    getStoragePath,
    makeConfig,
    makeTenantContext,
    setupStorage,
    TENANT_ID,
    writeTestFile
} from "./utils/helpers.js";

// The real `open`, wrapped so a test can make one call fail.
vi.mock("node:fs/promises", async importOriginal => {
    const actual = await importOriginal<typeof import("node:fs/promises")>();
    return { ...actual, open: vi.fn(actual.open) };
});

beforeEach(async () => {
    await setupStorage();
});

afterEach(async () => {
    await cleanupStorage();
});

const filesPath = () => path.join(getStoragePath(), "tenants", TENANT_ID, "files");

const createStorage = () => new DiskFileContentsStorage(makeTenantContext(), makeConfig());

describe("put file contents", () => {
    it("should write the bytes under the tenant's files, readable by key", async () => {
        const contents = Buffer.from("generated report");

        const result = await createStorage().put({
            key: "abc/report.txt",
            contents,
            contentType: "text/plain"
        });

        expect(result.isOk()).toBe(true);
        expect(existsSync(path.join(filesPath(), "abc", "report.txt"))).toBe(true);

        const read = await new GetFileContentsByKeyUseCase(
            makeTenantContext(),
            makeConfig()
        ).execute("abc/report.txt");
        expect(read.value.buffer).toEqual(contents);
    });

    it("should refuse a key that already has bytes and keep them", async () => {
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/report.txt`, Buffer.from("first"));

        const result = await createStorage().put({
            key: "abc/report.txt",
            contents: Buffer.from("second"),
            contentType: "text/plain"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("FileManager/File/AlreadyExistsError");
        const stored = await readFile(path.join(filesPath(), "abc", "report.txt"), "utf8");
        expect(stored).toBe("first");
    });

    it("should remove a partly written file when the write fails, so the key can be stored again", async () => {
        // Writes one chunk, then fails: the file is created and holds partial bytes.
        async function* failingContents() {
            yield Buffer.from("partial");
            throw new Error("disk went away");
        }

        const failed = await createStorage().put({
            key: "abc/report.txt",
            contents: failingContents() as unknown as Buffer,
            contentType: "text/plain"
        });

        expect(failed.isFail()).toBe(true);
        expect(failed.error.code).toBe("FileManager/File/PersistenceError");
        expect(existsSync(path.join(filesPath(), "abc", "report.txt"))).toBe(false);

        const retried = await createStorage().put({
            key: "abc/report.txt",
            contents: Buffer.from("complete"),
            contentType: "text/plain"
        });

        expect(retried.isOk()).toBe(true);
        const stored = await readFile(path.join(filesPath(), "abc", "report.txt"), "utf8");
        expect(stored).toBe("complete");
    });

    it("should keep bytes another call wrote when this call can't open the file", async () => {
        // Another put stores the key, then this call's open fails before creating anything.
        vi.mocked(open).mockImplementationOnce(async filePath => {
            await writeTestFile(`tenants/${TENANT_ID}/files/abc/report.txt`, Buffer.from("first"));
            throw Object.assign(new Error(`EMFILE: too many open files, open '${filePath}'`), {
                code: "EMFILE"
            });
        });

        const result = await createStorage().put({
            key: "abc/report.txt",
            contents: Buffer.from("second"),
            contentType: "text/plain"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("FileManager/File/PersistenceError");
        const stored = await readFile(path.join(filesPath(), "abc", "report.txt"), "utf8");
        expect(stored).toBe("first");
    });

    it.each(["../../other-tenant/files/x.txt", "../x.txt", "/"])(
        "should refuse key %j that points outside the tenant's files",
        async key => {
            const result = await createStorage().put({
                key,
                contents: Buffer.from("x"),
                contentType: "text/plain"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("FileManager/File/PersistenceError");
            expect(existsSync(path.join(getStoragePath(), "tenants", "other-tenant"))).toBe(false);
        }
    );
});

describe("delete file contents", () => {
    it("should delete the bytes and the file's empty folder", async () => {
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/report.txt`, Buffer.from("x"));

        const result = await createStorage().delete("abc/report.txt");

        expect(result.isOk()).toBe(true);
        expect(existsSync(path.join(filesPath(), "abc"))).toBe(false);
        expect(existsSync(filesPath())).toBe(true);
    });

    it("should keep the folder when other files are in it", async () => {
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/report.txt`, Buffer.from("x"));
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/other.txt`, Buffer.from("y"));

        await createStorage().delete("abc/report.txt");

        expect(existsSync(path.join(filesPath(), "abc", "report.txt"))).toBe(false);
        expect(existsSync(path.join(filesPath(), "abc", "other.txt"))).toBe(true);
    });

    it("should succeed when nothing is stored under the key", async () => {
        const result = await createStorage().delete("missing/file.txt");

        expect(result.isOk()).toBe(true);
    });
});
