import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FilesListCache } from "../shared/abstractions.js";
import {
    DeleteFileUseCase as UseCaseAbstraction,
    DeleteFileGateway as GatewayAbstraction,
    type IDeleteFileGateway,
    type DeleteFileGatewayParams
} from "./abstractions.js";
import { DeleteFileUseCase } from "./DeleteFileUseCase.js";
import { DeleteFileRepository } from "./DeleteFileRepository.js";
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

type MockGateway = IDeleteFileGateway & { execute: ReturnType<typeof vi.fn> };

function createMockGateway(): MockGateway {
    const execute = vi.fn<(params: DeleteFileGatewayParams) => Promise<boolean>>();
    execute.mockResolvedValue(true);
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
    container.register(DeleteFileRepository).inSingletonScope();
    container.register(DeleteFileUseCase);

    return { container, cache };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DeleteFile Feature", () => {
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
    // Successful deletion.
    // -----------------------------------------------------------------------

    it("should call gateway with the file ID", async () => {
        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({ id: "file-1" });

        expect(mockGateway.execute).toHaveBeenCalledTimes(1);
        expect(mockGateway.execute).toHaveBeenCalledWith({ id: "file-1" });
    });

    it("should return success result on successful deletion", async () => {
        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute({ id: "file-1" });

        expect(result.success).toBe(true);
    });

    it("should remove the file from cache after successful deletion", async () => {
        // Seed the cache with the file.
        const file = createFile({ id: "file-del" });
        cache.addItems([file]);
        expect(cache.getItem(f => f.id === "file-del")).toBeDefined();

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({ id: "file-del" });

        expect(cache.getItem(f => f.id === "file-del")).toBeUndefined();
    });

    it("should only remove the target file, leaving others untouched", async () => {
        // Seed cache with two files.
        const fileA = createFile({ id: "file-a", name: "a.jpg" });
        const fileB = createFile({ id: "file-b", name: "b.jpg" });
        cache.addItems([fileA, fileB]);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({ id: "file-a" });

        // file-a should be removed.
        expect(cache.getItem(f => f.id === "file-a")).toBeUndefined();

        // file-b should remain.
        expect(cache.getItem(f => f.id === "file-b")).toBeDefined();
        expect(cache.getItem(f => f.id === "file-b")!.name).toBe("b.jpg");
    });

    // -----------------------------------------------------------------------
    // Error handling.
    // -----------------------------------------------------------------------

    it("should return error result when gateway throws", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Delete failed"));

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute({ id: "file-1" });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("DELETE_FILE_ERROR");
            expect(result.error.message).toBe("Delete failed");
        }
    });

    it("should not remove file from cache when gateway throws", async () => {
        // Seed cache with the file.
        const file = createFile({ id: "file-err", name: "keep-me.jpg" });
        cache.addItems([file]);

        mockGateway.execute.mockRejectedValue(new Error("Delete failed"));

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({ id: "file-err" });

        // Cache should still have the file.
        const cached = cache.getItem(f => f.id === "file-err");
        expect(cached).toBeDefined();
        expect(cached!.name).toBe("keep-me.jpg");
    });
});
