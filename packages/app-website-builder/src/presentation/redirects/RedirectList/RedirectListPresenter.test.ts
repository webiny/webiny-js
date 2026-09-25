import { describe, it, expect, vi, beforeEach } from "vitest";
import { observable } from "mobx";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/ListPresenter.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { Redirect } from "~/domain/Redirect/Redirect.js";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    ListRedirectsGateway,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult
} from "~/features/redirects/listRedirects/abstractions.js";
import { ListRedirectsUseCase } from "~/features/redirects/listRedirects/ListRedirectsUseCase.js";
import { ListRedirectsRepository } from "~/features/redirects/listRedirects/ListRedirectsRepository.js";
import {
    CreateRedirectGateway,
    CreateRedirectUseCase as CreateRedirectUseCaseAbstraction
} from "~/features/redirects/createRedirect/abstractions.js";
import { CreateRedirectUseCase } from "~/features/redirects/createRedirect/CreateRedirectUseCase.js";
import { CreateRedirectRepository } from "~/features/redirects/createRedirect/CreateRedirectRepository.js";
import {
    UpdateRedirectGateway,
    UpdateRedirectUseCase as UpdateRedirectUseCaseAbstraction,
    type UpdateRedirectParams
} from "~/features/redirects/updateRedirect/abstractions.js";
import { UpdateRedirectUseCase } from "~/features/redirects/updateRedirect/UpdateRedirectUseCase.js";
import { UpdateRedirectRepository } from "~/features/redirects/updateRedirect/UpdateRedirectRepository.js";
import {
    CreateRedirectPresenter,
    EditRedirectPresenter,
    RedirectListPresenter as Abstraction
} from "./abstractions.js";
import { RedirectListPresenter } from "./RedirectListPresenter.js";

const TOTAL_REDIRECTS = 120;
const PAGE_SIZE = 50;
const BASE_TIME = Date.UTC(2026, 0, 1);

const minutes = (n: number) => new Date(BASE_TIME + n * 60_000).toISOString();

/**
 * A higher index means a more recently *created* redirect, but a less recently *saved* one,
 * so sorting by `createdOn` and by `savedOn` produce opposite orders.
 */
function createRedirects(count: number): Redirect[] {
    return Array.from({ length: count }, (_, i) =>
        Redirect.create({
            id: `redirect-${i}`,
            location: { folderId: "root" },
            redirectFrom: `/from-${i}`,
            redirectTo: `/to-${i}`,
            redirectType: "permanent",
            isEnabled: i % 2 === 0,
            createdOn: minutes(i),
            savedOn: minutes(count - i)
        })
    );
}

/**
 * Sorts like the API: by the requested field, ties keep the original (id) order.
 */
function sortRedirects(redirects: Redirect[], sort = "createdOn_DESC"): Redirect[] {
    const [field, direction] = sort.split("_") as [keyof Redirect, "ASC" | "DESC"];
    const multiplier = direction === "ASC" ? 1 : -1;
    return [...redirects].sort((a, b) => {
        const left = String(a[field]);
        const right = String(b[field]);
        return left === right ? 0 : multiplier * (left < right ? -1 : 1);
    });
}

function createListGateway(redirects: Redirect[]): ListRedirectsGateway.Interface {
    return {
        execute: vi.fn(
            async (params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> => {
                const sorted = sortRedirects(redirects, params.sort?.[0]);
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
        currentFolderTitle: "All redirects",
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

/**
 * Expected redirect IDs for a contiguous range of indexes, in the given order.
 */
function range(from: number, to: number): string[] {
    const step = from <= to ? 1 : -1;
    const ids: string[] = [];
    for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
        ids.push(`redirect-${i}`);
    }
    return ids;
}

describe("RedirectListPresenter", () => {
    let presenter: Abstraction.Interface;
    let container: Container;
    let redirects: Redirect[];

    const rowIds = () => presenter.vm.list.rows.map(row => row.id);

    const waitForQuery = async (field: string, direction: "ASC" | "DESC") => {
        await vi.waitFor(() => {
            expect(presenter.vm.list.appliedQuery?.sort).toEqual({ field, direction });
            expect(presenter.vm.list.pagination.loading).toBe(false);
        });
    };

    const initAndWait = async () => {
        presenter.init();
        await waitForQuery("createdOn", "DESC");
    };

    const sortAndWait = async (field: string, direction: "ASC" | "DESC") => {
        presenter.actions.sort.set(field, direction);
        await waitForQuery(field, direction);
    };

    const loadAll = async () => {
        while (presenter.vm.list.pagination.hasMore) {
            await presenter.actions.loadMore();
        }
    };

    beforeEach(() => {
        container = new Container();
        redirects = createRedirects(TOTAL_REDIRECTS);

        container.registerInstance(RedirectsListCache, new ListCache<Redirect>("id"));

        container.registerInstance(ListRedirectsGateway, createListGateway(redirects));
        container.register(ListRedirectsRepository).inSingletonScope();
        container.register(ListRedirectsUseCase);

        container.registerInstance(CreateRedirectGateway, {
            execute: vi.fn(async params =>
                Redirect.create({
                    ...params,
                    id: "redirect-new",
                    createdOn: minutes(TOTAL_REDIRECTS + 1),
                    savedOn: minutes(TOTAL_REDIRECTS + 1)
                })
            )
        });
        container.register(CreateRedirectRepository).inSingletonScope();
        container.register(CreateRedirectUseCase);

        container.registerInstance(UpdateRedirectGateway, {
            execute: vi.fn(async (params: UpdateRedirectParams) => {
                const existing = redirects.find(r => r.id === params.id)!;
                return Redirect.create({
                    ...existing,
                    ...params,
                    savedOn: minutes(TOTAL_REDIRECTS + 1)
                });
            })
        });
        container.register(UpdateRedirectRepository).inSingletonScope();
        container.register(UpdateRedirectUseCase);

        container.register(ListPresenter);
        container.registerInstance(FolderTreePresenter, createFolderTreePresenter());
        container.registerInstance(GetDescendantFoldersUseCase, { execute: () => [] });
        container.registerInstance(CreateRedirectPresenter, {
            vm: {},
            init: vi.fn(),
            save: vi.fn()
        } as unknown as CreateRedirectPresenter.Interface);
        container.registerInstance(EditRedirectPresenter, {
            vm: {},
            loadRedirect: vi.fn(),
            save: vi.fn()
        } as unknown as EditRedirectPresenter.Interface);

        container.register(RedirectListPresenter);

        presenter = container.resolve(Abstraction);
    });

    describe("pagination", () => {
        it("should show the most recently created redirects first", async () => {
            await initAndWait();

            expect(rowIds()).toEqual(range(119, 70));
        });

        it("should append the next batch of redirects to the bottom of the list", async () => {
            await initAndWait();

            await presenter.actions.loadMore();

            expect(rowIds()).toEqual(range(119, 20));
        });

        it("should keep all redirects in order after loading everything", async () => {
            await initAndWait();

            await loadAll();

            expect(rowIds()).toEqual(range(119, 0));
        });
    });

    describe("changing the sort", () => {
        it("should show only the first batch, sorted by the new field", async () => {
            await initAndWait();

            await sortAndWait("savedOn", "DESC");

            // `savedOn` runs opposite to `createdOn`, so the most recently saved is redirect-0.
            expect(rowIds()).toEqual(range(0, 49));
        });

        it("should show only the first batch when sorting by a boolean field", async () => {
            await initAndWait();

            await sortAndWait("isEnabled", "DESC");

            const expected = sortRedirects(redirects, "isEnabled_DESC")
                .slice(0, PAGE_SIZE)
                .map(r => r.id);
            expect(rowIds()).toEqual(expected);
        });

        it("should restore the original order when switching back", async () => {
            await initAndWait();
            await presenter.actions.loadMore();

            await sortAndWait("createdOn", "ASC");
            await sortAndWait("createdOn", "DESC");

            expect(rowIds()).toEqual(range(119, 70));
        });
    });

    describe("local cache changes", () => {
        const createRedirect = () =>
            container.resolve(CreateRedirectUseCaseAbstraction).execute({
                location: { folderId: "root" },
                redirectFrom: "/new",
                redirectTo: "/target",
                redirectType: "permanent",
                isEnabled: true
            });

        const updateRedirect = (id: string) => {
            const existing = redirects.find(r => r.id === id)!;
            return container.resolve(UpdateRedirectUseCaseAbstraction).execute({
                id,
                redirectFrom: existing.redirectFrom,
                redirectTo: "/changed",
                redirectType: existing.redirectType,
                isEnabled: existing.isEnabled
            });
        };

        it("should show a created redirect at the top when it sorts first", async () => {
            await initAndWait();

            await createRedirect();

            expect(rowIds()).toEqual(["redirect-new", ...range(119, 70)]);
        });

        it("should not show a created redirect that sorts past the loaded redirects", async () => {
            await initAndWait();
            await sortAndWait("createdOn", "ASC");

            await createRedirect();

            // The new redirect is the most recently created, so in ASC order it belongs at the
            // very end, after redirects that are not loaded yet.
            expect(rowIds()).toEqual(range(0, 49));
        });

        it("should keep an updated redirect in its position when sorted by createdOn", async () => {
            await initAndWait();

            await updateRedirect("redirect-100");

            expect(rowIds()).toEqual(range(119, 70));
            const updated = presenter.vm.list.rows.find(row => row.id === "redirect-100");
            expect(updated?.redirectTo).toBe("/changed");
        });

        it("should move an updated redirect to the top when sorted by savedOn", async () => {
            await initAndWait();
            await sortAndWait("savedOn", "DESC");

            await updateRedirect("redirect-30");

            expect(rowIds()).toEqual(["redirect-30", ...range(0, 29), ...range(31, 49)]);
        });
    });
});
