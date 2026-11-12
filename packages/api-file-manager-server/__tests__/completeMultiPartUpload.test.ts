import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { CompleteMultiPartUploadUseCaseImplementation } from "~/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.js";
import { writeMultipartUploadInfo } from "~/utils/multipartUploadInfo.js";

const UPLOAD_ID = "65f1a2b3c4d5e6f708192a3b";
const OTHER_UPLOAD_ID = "65f1a2b3c4d5e6f708192a3c";

const exists = (filePath: string) =>
    access(filePath).then(
        () => true,
        () => false
    );

describe("CompleteMultiPartUploadUseCase", () => {
    let storagePath: string;
    const env = { ...process.env };
    const useCase = () => {
        const Impl = CompleteMultiPartUploadUseCaseImplementation as any;
        return new Impl({ getTenant: () => ({ id: "root" }) });
    };
    const uploadDir = (id: string) => path.join(storagePath, "tenants/root/multipart", id);

    const createUpload = async (id: string, fileKey: string) => {
        await mkdir(uploadDir(id), { recursive: true });
        await writeMultipartUploadInfo(uploadDir(id), { fileKey });
        await writeFile(path.join(uploadDir(id), "part-2"), "world");
        await writeFile(path.join(uploadDir(id), "part-1"), "hello ");
    };

    beforeEach(async () => {
        storagePath = await mkdtemp(path.join(os.tmpdir(), "fm-server-multipart-"));
        process.env.WEBINY_LOCAL_STORAGE_PATH = storagePath;
        await createUpload(UPLOAD_ID, "abc/a.txt");
        await createUpload(OTHER_UPLOAD_ID, "def/b.txt");
    });

    afterEach(async () => {
        await rm(storagePath, { recursive: true, force: true });
        process.env = { ...env };
    });

    it("should assemble the parts into the bound file and remove only that upload", async () => {
        await useCase().execute({ uploadId: UPLOAD_ID, fileKey: "abc/a.txt" });
        expect(
            await readFile(path.join(storagePath, "tenants/root/files/abc/a.txt"), "utf-8")
        ).toBe("hello world");
        expect(await exists(uploadDir(UPLOAD_ID))).toBe(false);
        expect(await exists(uploadDir(OTHER_UPLOAD_ID))).toBe(true);
    });

    it("should refuse a file key the upload was not created for", async () => {
        await expect(
            useCase().execute({ uploadId: UPLOAD_ID, fileKey: "victim/v.txt" })
        ).rejects.toThrow("Upload not found.");
        expect(await exists(path.join(storagePath, "tenants/root/files/victim"))).toBe(false);
    });

    it("should refuse invalid upload ids", async () => {
        for (const uploadId of ["", ".", "..", "../multipart"]) {
            await expect(useCase().execute({ uploadId, fileKey: "abc/a.txt" })).rejects.toThrow(
                "Invalid upload id."
            );
        }
        expect(await exists(uploadDir(UPLOAD_ID))).toBe(true);
        expect(await exists(uploadDir(OTHER_UPLOAD_ID))).toBe(true);
    });

    it("should refuse to overwrite an existing file", async () => {
        const dest = path.join(storagePath, "tenants/root/files/abc/a.txt");
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, "original");
        await expect(
            useCase().execute({ uploadId: UPLOAD_ID, fileKey: "abc/a.txt" })
        ).rejects.toThrow("File already exists.");
        expect(await readFile(dest, "utf-8")).toBe("original");
    });
});
