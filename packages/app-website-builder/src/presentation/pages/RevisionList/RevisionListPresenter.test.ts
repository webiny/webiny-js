import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { PageRevision, pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/getPageRevisions/abstractions.js";
import {
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository
} from "~/features/pages/shared/abstractions.js";
import { RevisionListPresenter as PresenterAbstraction } from "./abstractions.js";
import { RevisionListPresenter } from "./RevisionListPresenter.js";

const createRevision = (id: string, entryId: string, version: number, savedOn: string) => {
    return PageRevision.create({
        id,
        entryId,
        version,
        savedOn,
        status: WbPageStatus.Draft,
        title: `Page ${entryId}`,
        locked: false,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        createdOn: savedOn,
        revisionDescription: undefined
    });
};

describe("RevisionListPresenter", () => {
    const revisionsCache = pageRevisionsCacheFactory.getCache();

    const getPageRevisions = {
        execute: vi.fn().mockResolvedValue([])
    };

    const loadingRepository = {
        isLoading: vi.fn().mockReturnValue(false)
    };

    const pageLoadingRepository = {
        isLoading: vi.fn().mockReturnValue(false)
    };

    const createPresenter = () => {
        const container = new Container();
        container.registerInstance(PageRevisionsCache, revisionsCache);
        container.registerInstance(
            WbPageRevisionsLoadingRepository,
            loadingRepository as unknown as WbPageRevisionsLoadingRepository.Interface
        );
        container.registerInstance(
            WbPageLoadingRepository,
            pageLoadingRepository as unknown as WbPageLoadingRepository.Interface
        );
        container.registerInstance(GetPageRevisionsUseCase, getPageRevisions);
        container.register(RevisionListPresenter).inSingletonScope();

        return container.resolve(PresenterAbstraction);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        loadingRepository.isLoading.mockReturnValue(false);
        pageLoadingRepository.isLoading.mockReturnValue(false);
        revisionsCache.clear();
    });

    it("should fetch the revisions when initialized", () => {
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });

        expect(getPageRevisions.execute).toHaveBeenCalledTimes(1);
        expect(getPageRevisions.execute).toHaveBeenCalledWith({ entryId: "page-1" });
    });

    it("should not refetch the revisions when initialized with the same entry", () => {
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });
        presenter.init({ entryId: "page-1" });

        expect(getPageRevisions.execute).toHaveBeenCalledTimes(1);

        presenter.init({ entryId: "page-2" });

        expect(getPageRevisions.execute).toHaveBeenCalledTimes(2);
    });

    it("should only expose the revisions of the current page, newest first", () => {
        const presenter = createPresenter();

        revisionsCache.addItems([
            createRevision("page-1#0001", "page-1", 1, "2026-09-20T00:00:00.000Z"),
            createRevision("page-1#0002", "page-1", 2, "2026-09-22T00:00:00.000Z"),
            createRevision("page-2#0001", "page-2", 1, "2026-09-21T00:00:00.000Z")
        ]);

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.revisions.map(revision => revision.id)).toEqual([
            "page-1#0002",
            "page-1#0001"
        ]);
        expect(presenter.vm.isEmpty).toBeFalse();
    });

    it("should not report an empty list while loading", () => {
        loadingRepository.isLoading.mockReturnValue(true);
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.revisions).toBeEmpty();
        expect(presenter.vm.isLoading).toBeTrue();
        expect(presenter.vm.isEmpty).toBeFalse();
    });

    it("should report a mutation in progress", () => {
        pageLoadingRepository.isLoading.mockImplementation(action => action === "PUBLISH");
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.isMutating).toBeTrue();
    });

    it("should not report a mutation for unrelated page actions", () => {
        // The "WbPage" namespace is shared with the pages table.
        pageLoadingRepository.isLoading.mockImplementation(action => action === "LIST");
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.isMutating).toBeFalse();
    });

    it("should reflect a status change made through the cache", () => {
        // The revisions menu and the drawer share this presenter, so a mutation made in one of
        // them must be visible in the other without a refetch.
        const presenter = createPresenter();

        revisionsCache.addItems([
            createRevision("page-1#0001", "page-1", 1, "2026-09-20T00:00:00.000Z")
        ]);

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.revisions[0].status).toEqual(WbPageStatus.Draft);

        revisionsCache.updateItems(revision =>
            revision.id === "page-1#0001" ? revision.withStatus(WbPageStatus.Unpublished) : revision
        );

        expect(presenter.vm.revisions[0].status).toEqual(WbPageStatus.Unpublished);
        expect(getPageRevisions.execute).toHaveBeenCalledTimes(1);
    });
});
