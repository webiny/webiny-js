import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { PageRevision, pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import {
    DeletePageRevisionUseCase as UseCaseAbstraction,
    DeletePageRevisionGateway as GatewayAbstraction
} from "./abstractions.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";
import { DeletePageRevisionRepository } from "./DeletePageRevisionRepository.js";
import { PageRevisionsCache } from "~/features/pages/shared/abstractions.js";

const createRevision = (id: string, version: number) => {
    return PageRevision.create({
        id,
        entryId: "page-1",
        version,
        status: WbPageStatus.Draft,
        savedOn: "2026-09-21T00:00:00.000Z",
        title: "Page 1",
        locked: false,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        createdOn: "2026-09-21T00:00:00.000Z",
        revisionDescription: undefined
    });
};

describe("DeletePageRevision", () => {
    const gateway = {
        execute: vi.fn().mockResolvedValue(undefined)
    };

    const revisionsCache = pageRevisionsCacheFactory.getCache();

    const createUseCase = () => {
        const container = new Container();
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(GatewayAbstraction, gateway);
        container.register(DeletePageRevisionRepository).inSingletonScope();
        container.register(DeletePageRevisionUseCase);

        return container.resolve(UseCaseAbstraction);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        revisionsCache.clear();
        revisionsCache.addItems([
            createRevision("page-1#0001", 1),
            createRevision("page-1#0002", 2)
        ]);
    });

    it("should remove the deleted revision from the revisions cache", async () => {
        const deletePageRevision = createUseCase();

        await deletePageRevision.execute({ id: "page-1#0001" });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenCalledWith("page-1#0001");

        expect(revisionsCache.count()).toEqual(1);
        expect(revisionsCache.getItem(r => r.id === "page-1#0001")).toBeUndefined();
        expect(revisionsCache.getItem(r => r.id === "page-1#0002")).toBeDefined();
    });

    it("should keep the cache untouched if the deletion fails", async () => {
        gateway.execute.mockRejectedValueOnce(new Error("Could not delete page revision."));
        const deletePageRevision = createUseCase();

        await expect(deletePageRevision.execute({ id: "page-1#0001" })).rejects.toThrow(
            "Could not delete page revision."
        );

        expect(revisionsCache.count()).toEqual(2);
    });
});
