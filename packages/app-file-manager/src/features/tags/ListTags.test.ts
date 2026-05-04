import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import {
    ListTagsUseCase as UseCaseAbstraction,
    ListTagsRepository as RepositoryAbstraction,
    ListTagsGateway as GatewayAbstraction,
    type IListTagsGateway,
    type ListTagsGatewayParams,
    type ListTagsGatewayResult
} from "./abstractions.js";
import { ListTagsUseCase } from "./ListTagsUseCase.js";
import { ListTagsRepository } from "./ListTagsRepository.js";
import type { FmTag } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTags(count: number): FmTag[] {
    return Array.from({ length: count }, (_, i) => ({
        tag: `tag-${i}`,
        count: (i + 1) * 10
    }));
}

type MockGateway = IListTagsGateway & { execute: ReturnType<typeof vi.fn> };

function createMockGateway(tags: FmTag[] = createTags(3)): MockGateway {
    const execute = vi.fn<(params: ListTagsGatewayParams) => Promise<ListTagsGatewayResult>>();
    execute.mockResolvedValue(tags);
    return { execute };
}

function createContainer(mockGateway: MockGateway) {
    const container = new Container();

    // Register the mock gateway instance.
    container.registerInstance(GatewayAbstraction, mockGateway);

    // Register the real repository and use case.
    container.register(ListTagsRepository).inSingletonScope();
    container.register(ListTagsUseCase);

    return container;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ListTags Feature", () => {
    let mockGateway: MockGateway;
    let container: Container;

    beforeEach(() => {
        mockGateway = createMockGateway();
        container = createContainer(mockGateway);
    });

    // -----------------------------------------------------------------------
    // UseCase invokes gateway with correct params.
    // -----------------------------------------------------------------------

    it("should call gateway with the provided where params", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute({
            where: { tags_startsWith: "image:" }
        });

        expect(mockGateway.execute).toHaveBeenCalledWith({
            where: { tags_startsWith: "image:" }
        });
    });

    it("should call gateway with undefined where when not provided", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute();

        expect(mockGateway.execute).toHaveBeenCalledWith({
            where: undefined
        });
    });

    // -----------------------------------------------------------------------
    // UseCase returns tags.
    // -----------------------------------------------------------------------

    it("should return tags from the gateway", async () => {
        const tags = createTags(5);
        mockGateway.execute.mockResolvedValue(tags);

        const useCase = container.resolve(UseCaseAbstraction);
        const result = await useCase.execute();

        expect(result).toEqual(tags);
    });

    // -----------------------------------------------------------------------
    // Repository caches tags as MobX observable state.
    // -----------------------------------------------------------------------

    it("should cache tags in the repository after fetch", async () => {
        const tags = createTags(3);
        mockGateway.execute.mockResolvedValue(tags);

        const repository = container.resolve(RepositoryAbstraction);

        // Initially empty.
        expect(repository.tags).toEqual([]);

        await repository.execute({});

        // Tags should be cached.
        expect(repository.tags).toEqual(tags);
    });

    // -----------------------------------------------------------------------
    // Repository refreshes tags on subsequent calls.
    // -----------------------------------------------------------------------

    it("should update cached tags on subsequent fetches", async () => {
        const initialTags = createTags(2);
        const updatedTags = [
            { tag: "tag-0", count: 15 },
            { tag: "tag-1", count: 25 },
            { tag: "tag-2", count: 5 }
        ];

        mockGateway.execute
            .mockResolvedValueOnce(initialTags)
            .mockResolvedValueOnce(updatedTags);

        const repository = container.resolve(RepositoryAbstraction);

        // First fetch.
        await repository.execute({});
        expect(repository.tags).toEqual(initialTags);

        // Second fetch (simulating refresh after file tag update).
        await repository.execute({});
        expect(repository.tags).toEqual(updatedTags);
    });

    // -----------------------------------------------------------------------
    // Gateway error propagation.
    // -----------------------------------------------------------------------

    it("should propagate gateway errors", async () => {
        mockGateway.execute.mockRejectedValue(new Error("Network error"));

        const useCase = container.resolve(UseCaseAbstraction);

        await expect(useCase.execute()).rejects.toThrow("Network error");
    });

    // -----------------------------------------------------------------------
    // Filtering with where params.
    // -----------------------------------------------------------------------

    it("should support filtering by createdBy", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute({
            where: { createdBy: "user-1" }
        });

        expect(mockGateway.execute).toHaveBeenCalledWith({
            where: { createdBy: "user-1" }
        });
    });

    it("should support filtering with tags_not_startsWith", async () => {
        const useCase = container.resolve(UseCaseAbstraction);

        await useCase.execute({
            where: { tags_not_startsWith: "scope:" }
        });

        expect(mockGateway.execute).toHaveBeenCalledWith({
            where: { tags_not_startsWith: "scope:" }
        });
    });
});
