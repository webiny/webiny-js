import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FilesListCache } from "../shared/abstractions.js";
import {
    ListFilesUseCase as UseCaseAbstraction,
    ListFilesGateway as GatewayAbstraction,
    type IListFilesGateway,
    type ListFilesGatewayParams,
    type ListFilesGatewayResult
} from "./abstractions.js";
import { ListFilesUseCase } from "./ListFilesUseCase.js";
import { ListFilesRepository } from "./ListFilesRepository.js";
import type { FmFile } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFile(index: number): FmFile {
    return {
        id: `file-${index}`,
        name: `File ${index}`,
        key: `files/file-${index}.txt`,
        src: `https://cdn.example.com/files/file-${index}.txt`,
        type: "text/plain",
        size: index * 100,
        metadata: {},
        tags: [],
        createdOn: "2025-01-01T00:00:00Z",
        savedOn: "2025-01-01T00:00:00Z",
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        savedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        location: { folderId: "root" }
    };
}

function createFiles(count: number): FmFile[] {
    return Array.from({ length: count }, (_, i) => createFile(i));
}

type MockGateway = IListFilesGateway & { execute: ReturnType<typeof vi.fn> };

function createMockGateway(
    files: FmFile[] = createFiles(3),
    meta = { cursor: null as string | null, hasMoreItems: false, totalCount: files.length }
): MockGateway {
    const execute = vi.fn<(params: ListFilesGatewayParams) => Promise<ListFilesGatewayResult>>();
    execute.mockResolvedValue({ data: files, meta });
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
    container.register(ListFilesRepository).inSingletonScope();
    container.register(ListFilesUseCase);

    return { container, cache };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ListFiles Feature", () => {
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
    // UseCase invokes gateway with correct params.
    // -----------------------------------------------------------------------

    it("should call gateway with the provided params", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute({
            search: "hello",
            where: { type_in: ["image/png"] },
            sort: ["name_ASC"],
            limit: 10,
            after: "cursor-abc"
        });

        expect(mockGateway.execute).toHaveBeenCalledWith({
            search: "hello",
            where: { type_in: ["image/png"] },
            sort: ["name_ASC"],
            limit: 10,
            after: "cursor-abc"
        });
    });

    it("should call gateway with undefined optional params when not provided", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute({});

        expect(mockGateway.execute).toHaveBeenCalledWith({
            search: undefined,
            where: undefined,
            sort: undefined,
            limit: undefined,
            after: undefined
        });
    });

    // -----------------------------------------------------------------------
    // UseCase returns files and meta.
    // -----------------------------------------------------------------------

    it("should return files and meta from the gateway", async () => {
        const files = createFiles(5);
        const meta = { cursor: "next-cursor", hasMoreItems: true, totalCount: 10 };
        mockGateway.execute.mockResolvedValue({ data: files, meta });

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute({});

        expect(result.data).toEqual(files);
        expect(result.meta).toEqual(meta);
    });

    // -----------------------------------------------------------------------
    // Repository updates FilesListCache after fetch.
    // -----------------------------------------------------------------------

    it("should populate FilesListCache after fetch", async () => {
        const files = createFiles(3);
        mockGateway.execute.mockResolvedValue({
            data: files,
            meta: { cursor: null, hasMoreItems: false, totalCount: 3 }
        });

        expect(cache.hasItems()).toBe(false);

        const useCase = container.resolve(UseCaseAbstraction);
        await useCase.execute({});

        expect(cache.hasItems()).toBe(true);
        expect(cache.getItems()).toEqual(files);
    });

    // -----------------------------------------------------------------------
    // Cursor-based pagination.
    // -----------------------------------------------------------------------

    it("should support cursor-based pagination", async () => {
        const page1 = createFiles(3);
        const page2 = [createFile(3), createFile(4)];

        mockGateway.execute
            .mockResolvedValueOnce({
                data: page1,
                meta: { cursor: "page2-cursor", hasMoreItems: true, totalCount: 5 }
            })
            .mockResolvedValueOnce({
                data: page2,
                meta: { cursor: null, hasMoreItems: false, totalCount: 5 }
            });

        const useCase = container.resolve(UseCaseAbstraction);

        // First page.
        const result1 = await useCase.execute({ limit: 3 });
        expect(result1.data).toEqual(page1);
        expect(result1.meta.cursor).toBe("page2-cursor");
        expect(result1.meta.hasMoreItems).toBe(true);

        // Second page using cursor.
        const result2 = await useCase.execute({ limit: 3, after: "page2-cursor" });
        expect(result2.data).toEqual(page2);
        expect(result2.meta.cursor).toBeNull();
        expect(result2.meta.hasMoreItems).toBe(false);

        // Cache should contain all files from both pages.
        expect(cache.count()).toBe(5);
    });

    // -----------------------------------------------------------------------
    // Gateway error propagation.
    // -----------------------------------------------------------------------

    it("should propagate gateway errors", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Network error"));

        const useCase = container.resolve(UseCaseAbstraction);

        await expect(useCase.execute({})).rejects.toThrow("Network error");
    });
});
