import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FilesListCache } from "../shared/abstractions.js";
import {
    UpdateFileUseCase as UseCaseAbstraction,
    UpdateFileGateway as GatewayAbstraction,
    type IUpdateFileGateway,
    type UpdateFileGatewayParams
} from "./abstractions.js";
import { UpdateFileUseCase } from "./UpdateFileUseCase.js";
import { UpdateFileRepository } from "./UpdateFileRepository.js";
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
        tags: ["photo"],
        createdOn: "2025-01-01T00:00:00Z",
        savedOn: "2025-01-01T00:00:00Z",
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        savedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        location: { folderId: "root" },
        ...overrides
    };
}

type MockGateway = IUpdateFileGateway & { execute: ReturnType<typeof vi.fn> };

function createMockGateway(file: FmFile = createFile()): MockGateway {
    const execute = vi.fn<(params: UpdateFileGatewayParams) => Promise<FmFile>>();
    execute.mockResolvedValue(file);
    return { execute };
}

function createContainer(mockGateway: MockGateway) {
    const container = new Container();
    const cache = new ListCache<FmFile>();

    // Register the mock gateway instance.
    container.registerInstance(GatewayAbstraction, mockGateway);

    // Register the shared cache instance.
    container.registerInstance(FilesListCache, cache);

    // Register the real repository and use case.
    container.register(UpdateFileRepository).inSingletonScope();
    container.register(UpdateFileUseCase);

    return { container, cache };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateFile Feature", () => {
    let mockGateway: MockGateway;
    let cache: ListCache<FmFile>;
    let container: Container;

    beforeEach(() => {
        mockGateway = createMockGateway();
        const result = createContainer(mockGateway);
        container = result.container;
        cache = result.cache as ListCache<FmFile>;
    });

    // -----------------------------------------------------------------------
    // Metadata update.
    // -----------------------------------------------------------------------

    it("should call gateway with file ID and changed fields", async () => {
        const updated = createFile({ name: "renamed.jpg", tags: ["photo", "landscape"] });
        mockGateway.execute.mockResolvedValue(updated);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-1",
            data: { name: "renamed.jpg", tags: ["photo", "landscape"] }
        });

        expect(mockGateway.execute).toHaveBeenCalledTimes(1);
        const callArgs = mockGateway.execute.mock.calls[0][0];
        expect(callArgs.id).toBe("file-1");
        expect(callArgs.data.name).toBe("renamed.jpg");
        expect(callArgs.data.tags).toEqual(["photo", "landscape"]);
    });

    it("should return success result with the updated file", async () => {
        const updated = createFile({ name: "renamed.jpg" });
        mockGateway.execute.mockResolvedValue(updated);

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute({
            id: "file-1",
            data: { name: "renamed.jpg" }
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.file).toEqual(updated);
        }
    });

    it("should pass accessControl through to the gateway", async () => {
        const updated = createFile({
            accessControl: { type: "private-authenticated" }
        });
        mockGateway.execute.mockResolvedValue(updated);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-1",
            data: { accessControl: { type: "private-authenticated" } }
        });

        const callArgs = mockGateway.execute.mock.calls[0][0];
        expect(callArgs.data.accessControl).toEqual({ type: "private-authenticated" });
    });

    it("should pass metadata through to the gateway", async () => {
        const updated = createFile({
            metadata: { image: { width: 800, height: 600 } }
        });
        mockGateway.execute.mockResolvedValue(updated);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-1",
            data: { metadata: { image: { width: 800, height: 600 } } }
        });

        const callArgs = mockGateway.execute.mock.calls[0][0];
        expect(callArgs.data.metadata).toEqual({ image: { width: 800, height: 600 } });
    });

    // -----------------------------------------------------------------------
    // Move file (location.folderId change) updates cache correctly.
    // -----------------------------------------------------------------------

    it("should update the cached file when location.folderId changes", async () => {
        // Seed the cache with the original file.
        const original = createFile({ id: "file-move", location: { folderId: "folder-a" } });
        cache.addItems([original]);

        const moved = createFile({ id: "file-move", location: { folderId: "folder-b" } });
        mockGateway.execute.mockResolvedValue(moved);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-move",
            data: { location: { folderId: "folder-b" } }
        });

        const cached = cache.getItem(f => f.id === "file-move");
        expect(cached).toBeDefined();
        expect(cached!.location.folderId).toBe("folder-b");
    });

    it("should only update the matching file in cache, leaving others untouched", async () => {
        // Seed cache with two files.
        const fileA = createFile({ id: "file-a", name: "a.jpg" });
        const fileB = createFile({ id: "file-b", name: "b.jpg" });
        cache.addItems([fileA, fileB]);

        const updatedA = createFile({ id: "file-a", name: "a-renamed.jpg" });
        mockGateway.execute.mockResolvedValue(updatedA);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-a",
            data: { name: "a-renamed.jpg" }
        });

        // file-a should be updated.
        const cachedA = cache.getItem(f => f.id === "file-a");
        expect(cachedA!.name).toBe("a-renamed.jpg");

        // file-b should remain unchanged.
        const cachedB = cache.getItem(f => f.id === "file-b");
        expect(cachedB!.name).toBe("b.jpg");
    });

    // -----------------------------------------------------------------------
    // Error handling.
    // -----------------------------------------------------------------------

    it("should return error result when gateway throws", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Update failed"));

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute({
            id: "file-1",
            data: { name: "renamed.jpg" }
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("UPDATE_FILE_ERROR");
            expect(result.error.message).toBe("Update failed");
        }
    });

    it("should not update cache when gateway throws", async () => {
        // Seed cache with the original file.
        const original = createFile({ id: "file-err", name: "original.jpg" });
        cache.addItems([original]);

        mockGateway.execute.mockRejectedValue(new Error("Update failed"));

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({
            id: "file-err",
            data: { name: "should-not-apply.jpg" }
        });

        // Cache should still have the original file unchanged.
        const cached = cache.getItem(f => f.id === "file-err");
        expect(cached!.name).toBe("original.jpg");
    });
});
