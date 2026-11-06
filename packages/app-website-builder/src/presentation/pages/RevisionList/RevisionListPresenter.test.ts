import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus, type WbStatus } from "~/constants.js";
import { PageRevision, pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/getPageRevisions/abstractions.js";
import {
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository
} from "~/features/pages/shared/abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
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

    const permissions = {
        canEdit: vi.fn().mockReturnValue(true),
        canDelete: vi.fn().mockReturnValue(true),
        canPublish: vi.fn().mockReturnValue(true),
        canUnpublish: vi.fn().mockReturnValue(true)
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
        container.registerInstance(
            WbPermissions,
            permissions as unknown as WbPermissions.Interface
        );
        container.registerInstance(GetPageRevisionsUseCase, getPageRevisions);
        container.register(RevisionListPresenter).inSingletonScope();

        return container.resolve(PresenterAbstraction);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        loadingRepository.isLoading.mockReturnValue(false);
        pageLoadingRepository.isLoading.mockReturnValue(false);
        permissions.canEdit.mockReturnValue(true);
        permissions.canDelete.mockReturnValue(true);
        permissions.canPublish.mockReturnValue(true);
        permissions.canUnpublish.mockReturnValue(true);
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

        expect(presenter.vm.revisions.map(item => item.revision.id)).toEqual([
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
        pageLoadingRepository.isLoading.mockImplementation(
            action => action === "CREATE_REVISION_FROM"
        );
        const presenter = createPresenter();

        presenter.init({ entryId: "page-1" });

        expect(presenter.vm.isMutating).toBeTrue();
    });

    it.each(["PUBLISH", "UNPUBLISH", "DELETE"])(
        "should not report a mutation for %s, which is confirmed through a dialog",
        action => {
            // Those dialogs show their own loader, so a second one on the drawer is just noise.
            pageLoadingRepository.isLoading.mockImplementation(a => a === action);
            const presenter = createPresenter();

            presenter.init({ entryId: "page-1" });

            expect(presenter.vm.isMutating).toBeFalse();
        }
    );

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

        expect(presenter.vm.revisions[0].revision.status).toEqual(WbPageStatus.Draft);

        revisionsCache.updateItems(revision =>
            revision.id === "page-1#0001" ? revision.withStatus(WbPageStatus.Unpublished) : revision
        );

        expect(presenter.vm.revisions[0].revision.status).toEqual(WbPageStatus.Unpublished);
        expect(getPageRevisions.execute).toHaveBeenCalledTimes(1);
    });

    describe("capabilities", () => {
        const initWith = (status: WbStatus, locked = false) => {
            const revision = PageRevision.create({
                id: "page-1#0001",
                entryId: "page-1",
                version: 1,
                status,
                locked,
                savedOn: "2026-09-20T00:00:00.000Z",
                title: "Page 1",
                createdBy: { id: "admin", displayName: "Admin", type: "admin" },
                createdOn: "2026-09-20T00:00:00.000Z",
                revisionDescription: undefined
            });
            revisionsCache.addItems([revision]);

            const presenter = createPresenter();
            presenter.init({ entryId: "page-1" });
            return presenter.vm.revisions[0];
        };

        it("should allow publishing a draft, but not unpublishing it", () => {
            const item = initWith(WbPageStatus.Draft);

            expect(item.canPublish).toBeTrue();
            expect(item.canUnpublish).toBeFalse();
        });

        it("should allow unpublishing a published revision, but not publishing it again", () => {
            const item = initWith(WbPageStatus.Published);

            expect(item.canPublish).toBeFalse();
            expect(item.canUnpublish).toBeTrue();
        });

        it("should not allow editing a locked revision", () => {
            const item = initWith(WbPageStatus.Unpublished, true);

            expect(item.canEdit).toBeFalse();
            // Creating a new revision from a locked one is still fine.
            expect(item.canCreateFrom).toBeTrue();
        });

        it("should allow deleting a locked revision, matching the API", () => {
            const item = initWith(WbPageStatus.Published, true);

            expect(item.canDelete).toBeTrue();
        });

        it("should respect the permissions", () => {
            permissions.canEdit.mockReturnValue(false);
            permissions.canDelete.mockReturnValue(false);
            permissions.canPublish.mockReturnValue(false);

            const item = initWith(WbPageStatus.Draft);

            expect(item.canCreateFrom).toBeFalse();
            expect(item.canEdit).toBeFalse();
            expect(item.canPublish).toBeFalse();
            expect(item.canDelete).toBeFalse();
        });

        it("should check delete permission against the revision itself", () => {
            initWith(WbPageStatus.Draft);

            // Ownership is per revision, so the row must be passed to the permission check.
            expect(permissions.canDelete).toHaveBeenCalledWith(
                "page",
                expect.objectContaining({ id: "page-1#0001" })
            );
        });
    });
});
