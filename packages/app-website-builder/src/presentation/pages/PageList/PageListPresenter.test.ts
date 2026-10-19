import { describe, it, expect, vi, beforeEach } from "vitest";
import { observable } from "mobx";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/ListPresenter.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import {
    ListPagesGateway,
    type IListPagesGatewayParams,
    type IListPagesGatewayResult
} from "~/features/pages/listPages/abstractions.js";
import { ListPagesUseCase } from "~/features/pages/listPages/ListPagesUseCase.js";
import { ListPagesRepository } from "~/features/pages/listPages/ListPagesRepository.js";
import {
    FullPageCache,
    PageListCache,
    PageRevisionsCache
} from "~/features/pages/shared/abstractions.js";
import { PublishPageGateway } from "~/features/pages/publishPage/abstractions.js";
import { PublishPageUseCase as PublishPageUseCaseImpl } from "~/features/pages/publishPage/PublishPageUseCase.js";
import { PublishPageRepository } from "~/features/pages/publishPage/PublishPageRepository.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { UnpublishPageUseCase } from "~/features/pages/unpublishPage/abstractions.js";
import { MovePageUseCase } from "~/features/pages/movePage/abstractions.js";
import { DuplicatePageUseCase } from "~/features/pages/duplicatePage/abstractions.js";
import { PageListPresenter as Abstraction } from "./abstractions.js";
import { PageListPresenter } from "./PageListPresenter.js";

const TOTAL_PAGES = 300;
const PAGE_SIZE = 50;
const BASE_TIME = Date.UTC(2026, 0, 1);

const minutes = (n: number) => new Date(BASE_TIME + n * 60_000).toISOString();

/**
 * A higher index means a more recently *saved* page, but a less recently *created* one,
 * so sorting by `savedOn` and by `createdOn` produce opposite orders.
 */
function createPages(count: number): Page[] {
    return Array.from({ length: count }, (_, i) =>
        Page.create({
            id: `page-${i}#0001`,
            entryId: `page-${i}`,
            location: { folderId: "root" },
            properties: { title: `Page ${i}` },
            createdOn: minutes(count - i),
            savedOn: minutes(i)
        })
    );
}

/**
 * Simulates the API: filters by folder, sorts by the requested field, and paginates
 * with an offset-based cursor.
 */
function createGateway(pages: Page[]): ListPagesGateway.Interface {
    return {
        execute: vi.fn(
            async (params: IListPagesGatewayParams): Promise<IListPagesGatewayResult> => {
                const [sort = "savedOn_DESC"] = params.sort ?? [];
                const [field, direction] = sort.split("_") as [keyof Page, "ASC" | "DESC"];
                const multiplier = direction === "ASC" ? 1 : -1;

                const folderId = (params.where?.location as { folderId?: string })?.folderId;
                const sorted = pages
                    .filter(page => !folderId || page.location.folderId === folderId)
                    .sort((a, b) => multiplier * String(a[field]).localeCompare(String(b[field])));

                const offset = params.after ? Number(params.after) : 0;
                const limit = params.limit ?? PAGE_SIZE;
                const data = sorted.slice(offset, offset + limit);
                const next = offset + data.length;
                const hasMoreItems = next < sorted.length;

                return {
                    data,
                    meta: {
                        cursor: hasMoreItems ? String(next) : null,
                        hasMoreItems,
                        totalCount: sorted.length
                    }
                };
            }
        )
    };
}

function createFolderTreePresenter(): FolderTreePresenter.Interface {
    const vm = observable({
        folders: [],
        tree: [],
        currentFolderId: null as string | null,
        currentFolder: null,
        loading: false,
        operation: { active: false, mode: null },
        isRootFolder: true,
        currentFolderTitle: "All pages",
        childFolders: [],
        loadingNodeIds: []
    });

    return {
        get vm() {
            return vm as unknown as FolderTreePresenter.Interface["vm"];
        },
        selectFolder: vi.fn(),
        createFolder: vi.fn(),
        editFolder: vi.fn(),
        deleteFolder: vi.fn().mockResolvedValue(undefined),
        moveFolder: vi.fn().mockResolvedValue(undefined),
        loadChildFolders: vi.fn().mockResolvedValue(undefined),
        canManageStructure: vi.fn().mockReturnValue(true),
        getAncestorIds: vi.fn().mockReturnValue([]),
        submitOperation: vi.fn().mockResolvedValue(true),
        cancelOperation: vi.fn(),
        onFolderChange: vi.fn().mockReturnValue(() => {})
    };
}

const noopUseCase = { execute: vi.fn() };

/**
 * Expected entry IDs for a contiguous range of page indexes, in the given order.
 */
function range(from: number, to: number): string[] {
    const step = from <= to ? 1 : -1;
    const ids: string[] = [];
    for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
        ids.push(`page-${i}`);
    }
    return ids;
}

describe("PageListPresenter", () => {
    let presenter: Abstraction.Interface;
    let cache: ListCache<Page>;

    /**
     * Simulates the publish API: publishing is not a content modification, so the page
     * comes back with its `savedOn` unchanged.
     */
    const publishGateway: PublishPageGateway.Interface = {
        execute: vi.fn(async (id: string) => {
            const page = cache.getItem(p => p.id === id)!;
            return { ...page, status: "published" } as any;
        })
    };

    const rowIds = () => presenter.list.vm.rows.map(row => row.entryId);

    const waitForQuery = async (field: string, direction: "ASC" | "DESC") => {
        await vi.waitFor(() => {
            const sort = presenter.list.vm.appliedQuery?.sort;
            expect(sort).toEqual({ field, direction });
            expect(presenter.list.vm.pagination.loading).toBe(false);
        });
    };

    const initAndWait = async () => {
        presenter.init();
        await waitForQuery("savedOn", "DESC");
    };

    const loadAll = async () => {
        while (presenter.list.vm.pagination.hasMore) {
            await presenter.list.actions.loadMore();
        }
    };

    beforeEach(() => {
        const container = new Container();

        cache = new ListCache<Page>("entryId");
        container.registerInstance(PageListCache, cache);
        container.registerInstance(ListPagesGateway, createGateway(createPages(TOTAL_PAGES)));
        container.register(ListPagesRepository).inSingletonScope();
        container.register(ListPagesUseCase);

        container.register(ListPresenter);
        container.registerInstance(FolderTreePresenter, createFolderTreePresenter());
        container.registerInstance(Confirmation, { confirm: vi.fn() } as Confirmation.Interface);
        container.registerInstance(GetDescendantFoldersUseCase, { execute: () => [] });
        container.registerInstance(DeletePageUseCase, noopUseCase as any);
        container.registerInstance(FullPageCache, new ListCache<Page>("id"));
        container.registerInstance(PageRevisionsCache, pageRevisionsCacheFactory.getCache());
        container.registerInstance(PublishPageGateway, publishGateway);
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageUseCaseImpl);
        container.registerInstance(UnpublishPageUseCase, noopUseCase as any);
        container.registerInstance(MovePageUseCase, noopUseCase as any);
        container.registerInstance(DuplicatePageUseCase, noopUseCase as any);

        container.register(PageListPresenter);

        presenter = container.resolve(Abstraction);
    });

    describe("pagination", () => {
        it("should show the most recently saved pages first", async () => {
            await initAndWait();

            expect(rowIds()).toEqual(range(299, 250));
        });

        it("should append the next batch of pages to the bottom of the list", async () => {
            await initAndWait();

            await presenter.list.actions.loadMore();

            expect(rowIds()).toEqual(range(299, 200));
        });

        it("should keep all pages in order after loading everything", async () => {
            await initAndWait();

            await loadAll();

            expect(rowIds()).toEqual(range(299, 0));
        });
    });

    describe("changing the sort", () => {
        it("should show only the first batch, in the new direction", async () => {
            await initAndWait();

            presenter.list.actions.sort.set("savedOn", "ASC");
            await waitForQuery("savedOn", "ASC");

            expect(rowIds()).toEqual(range(0, 49));
        });

        it("should show only the first batch, sorted by the new field", async () => {
            await initAndWait();

            presenter.list.actions.sort.set("createdOn", "DESC");
            await waitForQuery("createdOn", "DESC");

            // `createdOn` runs opposite to `savedOn`, so the newest created page is page-0.
            expect(rowIds()).toEqual(range(0, 49));
        });

        it("should paginate in the new order", async () => {
            await initAndWait();

            presenter.list.actions.sort.set("savedOn", "ASC");
            await waitForQuery("savedOn", "ASC");
            await presenter.list.actions.loadMore();

            expect(rowIds()).toEqual(range(0, 99));
        });

        it("should restore the original order when switching back", async () => {
            await initAndWait();
            await presenter.list.actions.loadMore();

            presenter.list.actions.sort.set("savedOn", "ASC");
            await waitForQuery("savedOn", "ASC");

            presenter.list.actions.sort.set("savedOn", "DESC");
            await waitForQuery("savedOn", "DESC");

            expect(rowIds()).toEqual(range(299, 250));
        });
    });

    describe("local cache changes", () => {
        const newPage = () =>
            Page.create({
                id: "page-new#0001",
                entryId: "page-new",
                location: { folderId: "root" },
                properties: { title: "New page" },
                createdOn: minutes(TOTAL_PAGES + 1),
                savedOn: minutes(TOTAL_PAGES + 1)
            });

        it("should show a created page at the top when it sorts first", async () => {
            await initAndWait();

            cache.addItems([newPage()]);

            expect(rowIds()).toEqual(["page-new", ...range(299, 250)]);
        });

        it("should not show a created page that sorts past the loaded pages", async () => {
            await initAndWait();
            presenter.list.actions.sort.set("savedOn", "ASC");
            await waitForQuery("savedOn", "ASC");

            cache.addItems([newPage()]);

            // The new page is the most recently saved, so in ASC order it belongs at the very
            // end, after 250 pages that are not loaded yet.
            expect(rowIds()).toEqual(range(0, 49));
        });

        it("should show a created page in its sort position once everything is loaded", async () => {
            await initAndWait();
            presenter.list.actions.sort.set("savedOn", "ASC");
            await waitForQuery("savedOn", "ASC");
            await loadAll();

            cache.addItems([newPage()]);

            expect(rowIds()).toEqual([...range(0, 299), "page-new"]);
        });

        it("should move an updated page to its new sort position", async () => {
            await initAndWait();

            const page = cache.getItem(p => p.entryId === "page-260")!;
            cache.addItems([Page.create({ ...page, savedOn: minutes(TOTAL_PAGES + 1) })]);

            expect(rowIds()).toEqual(["page-260", ...range(299, 261), ...range(259, 250)]);
        });
    });

    describe("publishing", () => {
        it("should keep a published page in its position", async () => {
            await initAndWait();
            const before = rowIds();

            await presenter.publishPage("page-260#0001");

            expect(rowIds()).toEqual(before);
            const published = presenter.list.vm.rows.find(row => row.entryId === "page-260");
            expect(published?.status).toBe("published");
        });

        it("should keep a published page in its position after loading more pages", async () => {
            await initAndWait();
            await presenter.list.actions.loadMore();
            const before = rowIds();

            await presenter.publishPage("page-210#0001");

            expect(rowIds()).toEqual(before);
        });
    });
});
