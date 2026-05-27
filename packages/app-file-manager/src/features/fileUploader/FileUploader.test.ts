import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/sdk";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { FilesListCache } from "../shared/abstractions.js";
import { FileFieldsProvider } from "../shared/FileFieldsProvider.js";
import { FileUploader as Abstraction } from "./abstractions.js";
import { FileUploader } from "./FileUploader.js";
import type { FmFile } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFile(overrides: Partial<FmFile> = {}): FmFile {
    return {
        id: "file-1",
        name: "photo.jpg",
        key: "files/photo.jpg",
        src: "https://cdn.example.com/files/photo.jpg",
        type: "image/jpeg",
        size: 204800,
        metadata: {},
        tags: [],
        createdOn: "2025-01-01T00:00:00Z",
        savedOn: "2025-01-01T00:00:00Z",
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        savedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        location: { folderId: "root" },
        ...overrides
    };
}

function createBrowserFile(name: string, size = 1024): File {
    const content = new Uint8Array(size);
    return new File([content], name, { type: "image/jpeg" });
}

interface MockSdk {
    fileManager: {
        createFile: ReturnType<typeof vi.fn>;
        createFiles: ReturnType<typeof vi.fn>;
    };
}

function createMockSdk(): MockSdk {
    return {
        fileManager: {
            createFile: vi.fn(),
            createFiles: vi.fn()
        }
    };
}

function createContainer(mockSdk: MockSdk) {
    const container = new Container();
    const cache = new ListCache<FmFile>();

    container.registerInstance(WebinySdk, mockSdk as any);
    container.registerInstance(FilesListCache, cache);
    container.register(FileFieldsProvider).inSingletonScope();
    container.register(FileUploader).inSingletonScope();

    return { container, cache };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileUploader Feature", () => {
    let mockSdk: MockSdk;
    let cache: ListCache<FmFile>;
    let container: Container;

    beforeEach(() => {
        mockSdk = createMockSdk();
        const result = createContainer(mockSdk);
        container = result.container;
        cache = result.cache as ListCache<FmFile>;
    });

    // -----------------------------------------------------------------------
    // Single file upload.
    // -----------------------------------------------------------------------

    it("should call SDK createFile with correct params for single upload", async () => {
        const file = createBrowserFile("photo.jpg", 2048);
        const created = createFile({ id: "new-1", name: "photo.jpg" });
        mockSdk.fileManager.createFile.mockResolvedValue(Result.ok(created));

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file, { name: "photo.jpg", type: "image/jpeg" });

        expect(mockSdk.fileManager.createFile).toHaveBeenCalledTimes(1);
        const callArgs = mockSdk.fileManager.createFile.mock.calls[0][0];
        expect(callArgs.file).toBe(file);
        expect(callArgs.data.name).toBe("photo.jpg");
        expect(callArgs.data.type).toBe("image/jpeg");
        expect(callArgs.fields).toBeDefined();
        expect(callArgs.onProgress).toBeTypeOf("function");
    });

    it("should update job progress via onProgress callback", async () => {
        const file = createBrowserFile("photo.jpg", 2048);
        const created = createFile({ id: "new-1" });

        mockSdk.fileManager.createFile.mockImplementation(async (params: any) => {
            // Simulate progress callbacks.
            params.onProgress({ sent: 1024, total: 2048, percentage: 50 });
            params.onProgress({ sent: 2048, total: 2048, percentage: 100 });
            return Result.ok(created);
        });

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file, { name: "photo.jpg", type: "image/jpeg" });

        // After completion, job should be completed.
        expect(uploader.vm.jobs).toHaveLength(1);
        expect(uploader.vm.jobs[0].status).toBe("completed");
        expect(uploader.vm.jobs[0].progress.percentage).toBe(100);
    });

    it("should update cache on successful single upload", async () => {
        const file = createBrowserFile("photo.jpg");
        const created = createFile({ id: "uploaded-1", name: "photo.jpg" });
        mockSdk.fileManager.createFile.mockResolvedValue(Result.ok(created));

        expect(cache.hasItems()).toBe(false);

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file, { name: "photo.jpg", type: "image/jpeg" });

        expect(cache.hasItems()).toBe(true);
        expect(cache.getItem(f => f.id === "uploaded-1")).toEqual(created);
    });

    it("should mark job as failed when SDK returns error", async () => {
        const file = createBrowserFile("photo.jpg");
        mockSdk.fileManager.createFile.mockResolvedValue(Result.fail(new Error("Upload failed")));

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file, { name: "photo.jpg", type: "image/jpeg" });

        expect(uploader.vm.jobs).toHaveLength(1);
        expect(uploader.vm.jobs[0].status).toBe("failed");
        expect(uploader.vm.jobs[0].error).toBe("Upload failed");
        expect(cache.hasItems()).toBe(false);
    });

    // -----------------------------------------------------------------------
    // Batch upload.
    // -----------------------------------------------------------------------

    it("should call SDK createFiles with correct params for batch upload", async () => {
        const file1 = createBrowserFile("a.jpg", 1024);
        const file2 = createBrowserFile("b.jpg", 2048);
        const created1 = createFile({ id: "batch-1", name: "a.jpg" });
        const created2 = createFile({ id: "batch-2", name: "b.jpg" });

        mockSdk.fileManager.createFiles.mockResolvedValue(
            Result.ok({ successful: [created1, created2], failed: [] })
        );

        const uploader = container.resolve(Abstraction);
        await uploader.uploadMany(
            [
                { file: file1, data: { name: "a.jpg", type: "image/jpeg" } },
                { file: file2, data: { name: "b.jpg", type: "image/jpeg" } }
            ],
            { concurrency: 2, strategy: "continue" }
        );

        expect(mockSdk.fileManager.createFiles).toHaveBeenCalledTimes(1);
        const callArgs = mockSdk.fileManager.createFiles.mock.calls[0][0];
        expect(callArgs.files).toHaveLength(2);
        expect(callArgs.concurrency).toBe(2);
        expect(callArgs.strategy).toBe("continue");
    });

    it("should update cache with all successful files from batch", async () => {
        const file1 = createBrowserFile("a.jpg");
        const file2 = createBrowserFile("b.jpg");
        const created1 = createFile({ id: "batch-1", name: "a.jpg" });
        const created2 = createFile({ id: "batch-2", name: "b.jpg" });

        mockSdk.fileManager.createFiles.mockResolvedValue(
            Result.ok({ successful: [created1, created2], failed: [] })
        );

        const uploader = container.resolve(Abstraction);
        await uploader.uploadMany([
            { file: file1, data: { name: "a.jpg", type: "image/jpeg" } },
            { file: file2, data: { name: "b.jpg", type: "image/jpeg" } }
        ]);

        expect(cache.count()).toBe(2);
        expect(cache.getItem(f => f.id === "batch-1")).toBeDefined();
        expect(cache.getItem(f => f.id === "batch-2")).toBeDefined();
    });

    it("should track per-file progress in batch upload", async () => {
        const file1 = createBrowserFile("a.jpg", 1024);
        const file2 = createBrowserFile("b.jpg", 2048);
        const created1 = createFile({ id: "batch-1", name: "a.jpg" });
        const created2 = createFile({ id: "batch-2", name: "b.jpg" });

        mockSdk.fileManager.createFiles.mockImplementation(async (params: any) => {
            // Simulate per-file progress.
            params.files[0].onProgress({ sent: 1024, total: 1024, percentage: 100 });
            params.files[1].onProgress({ sent: 1024, total: 2048, percentage: 50 });
            params.files[1].onProgress({ sent: 2048, total: 2048, percentage: 100 });
            return Result.ok({ successful: [created1, created2], failed: [] });
        });

        const uploader = container.resolve(Abstraction);
        await uploader.uploadMany([
            { file: file1, data: { name: "a.jpg", type: "image/jpeg" } },
            { file: file2, data: { name: "b.jpg", type: "image/jpeg" } }
        ]);

        expect(uploader.vm.jobs).toHaveLength(2);
        expect(uploader.vm.completedCount).toBe(2);
    });

    it("should handle partial failures in batch upload (continue strategy)", async () => {
        const file1 = createBrowserFile("a.jpg");
        const file2 = createBrowserFile("b.jpg");
        const created1 = createFile({ id: "batch-ok", name: "a.jpg" });

        mockSdk.fileManager.createFiles.mockResolvedValue(
            Result.ok({
                successful: [created1],
                failed: [{ data: { name: "b.jpg" }, error: new Error("b.jpg failed") }]
            })
        );

        const uploader = container.resolve(Abstraction);
        await uploader.uploadMany(
            [
                { file: file1, data: { name: "a.jpg", type: "image/jpeg" } },
                { file: file2, data: { name: "b.jpg", type: "image/jpeg" } }
            ],
            { strategy: "continue" }
        );

        expect(uploader.vm.completedCount).toBe(1);
        expect(uploader.vm.failedCount).toBe(1);
        // Only the successful file should be in cache.
        expect(cache.count()).toBe(1);
        expect(cache.getItem(f => f.id === "batch-ok")).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // Abort.
    // -----------------------------------------------------------------------

    it("should pass AbortController signal to SDK for single upload", async () => {
        const file = createBrowserFile("photo.jpg");
        const created = createFile({ id: "abort-1" });
        mockSdk.fileManager.createFile.mockResolvedValue(Result.ok(created));

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file, { name: "photo.jpg", type: "image/jpeg" });

        // Verify signal was passed.
        const callArgs = mockSdk.fileManager.createFile.mock.calls[0][0];
        expect(callArgs.signal).toBeInstanceOf(AbortSignal);
    });

    it("should pass AbortController signal to SDK for batch upload", async () => {
        const file = createBrowserFile("photo.jpg");
        const created = createFile({ id: "abort-batch" });
        mockSdk.fileManager.createFiles.mockResolvedValue(
            Result.ok({ successful: [created], failed: [] })
        );

        const uploader = container.resolve(Abstraction);
        await uploader.uploadMany([{ file, data: { name: "photo.jpg", type: "image/jpeg" } }]);

        const callArgs = mockSdk.fileManager.createFiles.mock.calls[0][0];
        expect(callArgs.signal).toBeInstanceOf(AbortSignal);
    });

    // -----------------------------------------------------------------------
    // Clear.
    // -----------------------------------------------------------------------

    it("should remove completed and failed jobs on clear", async () => {
        const file1 = createBrowserFile("ok.jpg");
        const file2 = createBrowserFile("fail.jpg");

        // First upload succeeds.
        mockSdk.fileManager.createFile.mockResolvedValueOnce(
            Result.ok(createFile({ id: "ok-1", name: "ok.jpg" }))
        );
        // Second upload fails.
        mockSdk.fileManager.createFile.mockResolvedValueOnce(Result.fail(new Error("fail")));

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file1, { name: "ok.jpg", type: "image/jpeg" });
        await uploader.upload(file2, { name: "fail.jpg", type: "image/jpeg" });

        expect(uploader.vm.jobs).toHaveLength(2);
        expect(uploader.vm.completedCount).toBe(1);
        expect(uploader.vm.failedCount).toBe(1);

        uploader.clear();

        expect(uploader.vm.jobs).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // ViewModel computed properties.
    // -----------------------------------------------------------------------

    it("should compute overall progress from all jobs", async () => {
        const file1 = createBrowserFile("a.jpg", 1000);
        const file2 = createBrowserFile("b.jpg", 3000);
        const created1 = createFile({ id: "p-1", name: "a.jpg" });
        const created2 = createFile({ id: "p-2", name: "b.jpg" });

        mockSdk.fileManager.createFile
            .mockResolvedValueOnce(Result.ok(created1))
            .mockResolvedValueOnce(Result.ok(created2));

        const uploader = container.resolve(Abstraction);
        await uploader.upload(file1, { name: "a.jpg", type: "image/jpeg" });
        await uploader.upload(file2, { name: "b.jpg", type: "image/jpeg" });

        // Both completed — overall should be 100%.
        expect(uploader.vm.isUploading).toBe(false);
        expect(uploader.vm.overallProgress.percentage).toBe(100);
    });

    it("should report isUploading as false when no jobs exist", () => {
        const uploader = container.resolve(Abstraction);
        expect(uploader.vm.isUploading).toBe(false);
        expect(uploader.vm.jobs).toHaveLength(0);
        expect(uploader.vm.overallProgress.percentage).toBe(0);
    });
});
