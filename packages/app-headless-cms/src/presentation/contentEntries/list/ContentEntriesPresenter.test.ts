/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { makeAutoObservable } from "mobx";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/index.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { ContentEntriesCacheProviderImplementation } from "~/features/contentEntry/ContentEntriesCacheProvider.js";
import { CmsModelAccessor } from "~/features/contentEntry/abstractions.js";
import { CmsModelAccessor as CmsModelAccessorImpl } from "~/features/contentEntry/CmsModelAccessor.js";
import { ListEntriesFeature } from "~/features/contentEntry/listEntries/feature.js";
import { DeleteEntryFeature } from "~/features/contentEntry/deleteEntry/feature.js";
import { PublishEntryFeature } from "~/features/contentEntry/publishEntry/feature.js";
import { UnpublishEntryFeature } from "~/features/contentEntry/unpublishEntry/feature.js";
import { MoveEntryFeature } from "~/features/contentEntry/moveEntry/feature.js";
import { UpdateRevisionDescriptionFeature } from "~/features/contentEntry/updateRevisionDescription/feature.js";
import { ListEntriesGateway } from "~/features/contentEntry/listEntries/abstractions.js";
import { DeleteEntryGateway } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { PublishEntryGateway } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryGateway } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { MoveEntryGateway } from "~/features/contentEntry/moveEntry/abstractions.js";
import { UpdateRevisionDescriptionGateway } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { ContentEntriesPresenter } from "./abstractions.js";
import { ContentEntriesPresenterImplementation } from "./ContentEntriesPresenter.js";
import type { IContentEntriesPresenter } from "./abstractions.js";
import type {
    IFolderTreeViewModel,
    IFolderOperationState
} from "@webiny/app-aco/presentation/folderTree/abstractions.js";

const MODEL: CmsModel = {
    modelId: "testModel",
    name: "Test Model",
    singularApiName: "TestModel",
    pluralApiName: "TestModels",
    fields: [],
    layout: [],
    group: "group-1",
    titleFieldId: "title",
    descriptionFieldId: null,
    imageFieldId: null,
    tags: [],
    savedOn: ""
} as unknown as CmsModel;

function createEntry(
    entryId: string,
    folderId: string,
    overrides: Partial<CmsContentEntry> = {}
): CmsContentEntry {
    return {
        id: `${entryId}#0001`,
        entryId,
        meta: {
            title: entryId,
            status: "draft",
            version: 1,
            locked: false
        },
        wbyAco_location: { folderId },
        values: {},
        createdBy: { id: "user-1", displayName: "Test", type: "admin" },
        createdOn: "2024-01-01T00:00:00Z",
        savedOn: "2024-01-01T00:00:00Z",
        ...overrides
    } as unknown as CmsContentEntry;
}

class MockFolderTreePresenter implements FolderTreePresenter.Interface {
    private _currentFolderId: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get vm(): IFolderTreeViewModel {
        return {
            folders: [],
            tree: [],
            currentFolderId: this._currentFolderId,
            currentFolder: null,
            isRootFolder: this._currentFolderId === null,
            currentFolderTitle: "Home",
            childFolders: [],
            loading: false,
            loadingNodeIds: [],
            operation: { active: false, mode: null } as IFolderOperationState
        };
    }

    selectFolder(folderId: string | null): void {
        this._currentFolderId = folderId;
    }

    createFolder(): void {}
    editFolder(): void {}
    async deleteFolder(): Promise<void> {}
    async moveFolder(): Promise<void> {}
    async loadChildFolders(): Promise<void> {}
    canManageStructure(): boolean {
        return true;
    }
    getAncestorIds(): string[] {
        return [];
    }
    async submitOperation(): Promise<boolean> {
        return true;
    }
    cancelOperation(): void {}
    onFolderChange(): () => void {
        return () => {};
    }
}

interface TestSetup {
    presenter: IContentEntriesPresenter;
    listEntriesGateway: { execute: ReturnType<typeof vi.fn> };
    moveEntryGateway: { execute: ReturnType<typeof vi.fn> };
    deleteEntryGateway: { execute: ReturnType<typeof vi.fn> };
    getDescendantFolders: ReturnType<typeof vi.fn>;
    foldersPresenter: MockFolderTreePresenter;
}

function setup(): TestSetup {
    const container = new Container();

    ListPresenterFeature.register(container);

    const foldersPresenter = new MockFolderTreePresenter();
    container.registerInstance(FolderTreePresenter, foldersPresenter);

    container.registerInstance(Confirmation, {
        confirm: vi.fn(async (_name, _params, execute) => {
            if (execute) {
                await execute(undefined);
            }
            return true;
        })
    } as unknown as Confirmation.Interface);

    const getDescendantFolders = vi.fn().mockReturnValue([]);
    container.registerInstance(GetDescendantFoldersUseCase, {
        execute: getDescendantFolders
    });

    container.register(ContentEntriesCacheProviderImplementation).inSingletonScope();
    container.register(CmsModelAccessorImpl).inSingletonScope();
    container.resolve(CmsModelAccessor).setModel(MODEL);

    ListEntriesFeature.register(container);
    DeleteEntryFeature.register(container);
    PublishEntryFeature.register(container);
    UnpublishEntryFeature.register(container);
    MoveEntryFeature.register(container);
    UpdateRevisionDescriptionFeature.register(container);

    const listEntriesGateway = { execute: vi.fn() };
    const moveEntryGateway = { execute: vi.fn() };
    const deleteEntryGateway = { execute: vi.fn() };

    container.registerInstance(ListEntriesGateway, listEntriesGateway);
    container.registerInstance(MoveEntryGateway, moveEntryGateway);
    container.registerInstance(DeleteEntryGateway, deleteEntryGateway);
    container.registerInstance(PublishEntryGateway, { execute: vi.fn() });
    container.registerInstance(UnpublishEntryGateway, { execute: vi.fn() });
    container.registerInstance(UpdateRevisionDescriptionGateway, { execute: vi.fn() });

    container.register(ContentEntriesPresenterImplementation).inSingletonScope();
    const presenter = container.resolve(ContentEntriesPresenter);

    return {
        presenter,
        listEntriesGateway,
        moveEntryGateway,
        deleteEntryGateway,
        getDescendantFolders,
        foldersPresenter
    };
}

async function initPresenter(
    t: TestSetup,
    gatewayResponse: { data: CmsContentEntry[]; meta?: object }
) {
    t.listEntriesGateway.execute.mockResolvedValueOnce({
        data: gatewayResponse.data,
        meta: gatewayResponse.meta ?? {
            cursor: null,
            hasMoreItems: false,
            totalCount: gatewayResponse.data.length
        }
    });

    t.presenter.init();

    await vi.waitFor(() => {
        expect(t.presenter.list.vm.pagination.loading).toBe(false);
    });
}

describe("ContentEntriesPresenter", () => {
    let t: TestSetup;

    beforeEach(() => {
        t = setup();
    });

    describe("initial load", () => {
        it("should show root entries after setModel", async () => {
            const entries = [createEntry("entry-1", "root"), createEntry("entry-2", "root")];

            await initPresenter(t, { data: entries });

            expect(t.presenter.list.vm.rows).toHaveLength(2);
            expect(t.presenter.list.vm.rows.map(r => r.entryId)).toEqual(["entry-1", "entry-2"]);
        });

        it("should send folderId=root in the gateway query", async () => {
            await initPresenter(t, { data: [] });

            expect(t.listEntriesGateway.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        wbyAco_location: { folderId: "root" }
                    })
                })
            );
        });

        it("should set model after init", async () => {
            await initPresenter(t, { data: [] });

            expect(t.presenter.vm.model).toStrictEqual(MODEL);
        });
    });

    describe("folder navigation", () => {
        it("should filter to folder entries when navigating to a subfolder", async () => {
            const rootEntries = [createEntry("root-1", "root")];
            await initPresenter(t, { data: rootEntries });

            const folderEntries = [
                createEntry("folder-1", "folder-a"),
                createEntry("folder-2", "folder-a")
            ];

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: folderEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            });

            t.foldersPresenter.selectFolder("folder-a");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(2);
            });

            expect(t.presenter.list.vm.rows.map(r => r.entryId)).toEqual(["folder-1", "folder-2"]);
        });

        it("should show only root entries when navigating back to root", async () => {
            const rootEntries = [createEntry("root-1", "root")];
            await initPresenter(t, { data: rootEntries });

            const folderEntries = [createEntry("folder-1", "folder-a")];
            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: folderEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.foldersPresenter.selectFolder("folder-a");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("folder-1");
            });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: rootEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.foldersPresenter.selectFolder(null);

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("root-1");
            });
        });

        it("should not leak subfolder entries into root view", async () => {
            const rootEntries = [createEntry("root-1", "root")];
            await initPresenter(t, { data: rootEntries });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: [createEntry("folder-1", "folder-a")],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.foldersPresenter.selectFolder("folder-a");
            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
            });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: rootEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.foldersPresenter.selectFolder(null);
            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("root-1");
            });
        });
    });

    describe("search", () => {
        it("should show only search results from API", async () => {
            const rootEntries = [createEntry("entry-1", "root"), createEntry("entry-2", "root")];
            await initPresenter(t, { data: rootEntries });

            const searchResults = [createEntry("entry-1", "root")];
            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: searchResults,
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.presenter.list.actions.search.set("entry-1");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
            });

            expect(t.presenter.list.vm.rows[0].entryId).toBe("entry-1");
        });

        it("should include entries from subfolders when searching from root", async () => {
            await initPresenter(t, { data: [] });

            const searchResults = [
                createEntry("root-1", "root"),
                createEntry("folder-1", "folder-a")
            ];
            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: searchResults,
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            });

            t.presenter.list.actions.search.set("test");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(2);
            });
        });

        it("should search with folderId_in containing all descendant folders when in a subfolder", async () => {
            const folderEntries = [createEntry("folder-1", "folder-a")];
            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: folderEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.presenter.init({ initialFolderId: "folder-a" });

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.pagination.loading).toBe(false);
            });

            t.getDescendantFolders.mockReturnValue([
                { id: "folder-a" },
                { id: "folder-a-1" },
                { id: "folder-a-2" }
            ]);

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: [
                    createEntry("folder-1", "folder-a"),
                    createEntry("sub-1", "folder-a-1"),
                    createEntry("sub-2", "folder-a-2")
                ],
                meta: { cursor: null, hasMoreItems: false, totalCount: 3 }
            });

            t.presenter.list.actions.search.set("test");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(3);
            });

            expect(t.getDescendantFolders).toHaveBeenCalledWith("folder-a");

            const searchCall = t.listEntriesGateway.execute.mock.calls.at(-1) ?? [];
            expect(searchCall[0].where).toEqual(
                expect.objectContaining({
                    wbyAco_location: {
                        folderId_in: ["folder-a", "folder-a-1", "folder-a-2"]
                    }
                })
            );
        });

        it("should restore folder view when clearing search", async () => {
            const rootEntries = [createEntry("entry-1", "root"), createEntry("entry-2", "root")];
            await initPresenter(t, { data: rootEntries });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: [createEntry("entry-1", "root")],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.presenter.list.actions.search.set("entry-1");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
            });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: rootEntries,
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            });

            t.presenter.list.actions.search.clear();

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(2);
            });
        });
    });

    describe("status filter", () => {
        it("should filter by status locally", async () => {
            const entries = [
                createEntry("draft-1", "root", {
                    meta: {
                        title: "draft-1",
                        status: "draft",
                        version: 1,
                        locked: false
                    }
                }),
                createEntry("published-1", "root", {
                    meta: {
                        title: "published-1",
                        status: "published",
                        version: 1,
                        locked: false
                    }
                })
            ];
            await initPresenter(t, { data: entries });

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: entries.filter(e => (e.meta as { status: string }).status === "published"),
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            });

            t.presenter.list.actions.filter.set("status", "published");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("published-1");
            });
        });
    });

    describe("move entry", () => {
        it("should remove entry from current view after move", async () => {
            const entries = [createEntry("entry-1", "root"), createEntry("entry-2", "root")];
            await initPresenter(t, { data: entries });

            t.moveEntryGateway.execute.mockResolvedValueOnce(true);

            await t.presenter.moveEntry("entry-1#0001", "folder-b");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("entry-2");
            });
        });
    });

    describe("delete entry", () => {
        it("should remove entry from current view after delete", async () => {
            const entries = [createEntry("entry-1", "root"), createEntry("entry-2", "root")];
            await initPresenter(t, { data: entries });

            t.deleteEntryGateway.execute.mockResolvedValueOnce(true);

            await t.presenter.deleteEntry("entry-1#0001");

            await vi.waitFor(() => {
                expect(t.presenter.list.vm.rows).toHaveLength(1);
                expect(t.presenter.list.vm.rows[0].entryId).toBe("entry-2");
            });
        });
    });

    describe("vm", () => {
        it("should set model on init", () => {
            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
            t.presenter.init();
            expect(t.presenter.vm.model).toStrictEqual(MODEL);
        });

        it("should track selected entry", async () => {
            await initPresenter(t, { data: [] });

            expect(t.presenter.vm.showingEntry).toBe(false);

            t.presenter.selectEntry("some-id");
            expect(t.presenter.vm.selectedEntryId).toBe("some-id");
            expect(t.presenter.vm.showingEntry).toBe(true);

            t.presenter.deselectEntry();
            expect(t.presenter.vm.selectedEntryId).toBeNull();
            expect(t.presenter.vm.showingEntry).toBe(false);
        });

        it("should set selectedEntryId to 'new' on createEntry", async () => {
            await initPresenter(t, { data: [] });

            t.presenter.createEntry();
            expect(t.presenter.vm.selectedEntryId).toBe("new");
        });

        it("should show folders when no search or non-folder filters active", async () => {
            await initPresenter(t, { data: [] });

            expect(t.presenter.vm.showFolders).toBe(true);

            t.listEntriesGateway.execute.mockResolvedValueOnce({
                data: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });

            t.presenter.list.actions.search.set("test");

            await vi.waitFor(() => {
                expect(t.presenter.vm.showFolders).toBe(false);
            });
        });
    });
});
