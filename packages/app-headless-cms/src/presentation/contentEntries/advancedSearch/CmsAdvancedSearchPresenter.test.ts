import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import { Operation } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { ListFolderPermissionsTargetsUseCase } from "~/features/listFolderPermissionsTargets/abstractions.js";
import { ContentEntriesPresenter } from "~/presentation/contentEntries/list/abstractions.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import { CmsAdvancedSearchPresenter } from "./CmsAdvancedSearchPresenter.js";

const TARGETS: FolderLevelPermissionsTarget[] = [
    { id: "team-1", type: "team", target: "team:editors", name: "Editors", meta: {} },
    { id: "user-1", type: "admin", target: "admin:user-1", name: "Adam Jones", meta: {} },
    {
        id: "user-2",
        type: "admin",
        target: "admin:user-2",
        name: "",
        meta: { email: "nameless@webiny.com" }
    },
    { id: "user-3", type: "admin", target: "admin:user-3", name: "", meta: { email: null } }
];

const createFilter = (operation: Operation, value: string): FilterDTO => {
    return {
        id: "filter-1",
        name: "Filter",
        operation,
        groups: [
            {
                operation: Operation.AND,
                filters: [{ field: "title", condition: "_contains", value }]
            }
        ]
    };
};

const createPresenter = () => {
    const listTargets = vi.fn(async () => TARGETS);
    const set = vi.fn();
    const clear = vi.fn();
    const contentEntries = {
        vm: { model: { modelId: "class", fields: [] } },
        list: { actions: { filter: { set, clear } } }
    };

    const container = new Container();
    container.registerInstance(ListFolderPermissionsTargetsUseCase, { execute: listTargets });
    const contentEntriesInstance = contentEntries as unknown as ContentEntriesPresenter.Interface;
    container.registerInstance(ContentEntriesPresenter, contentEntriesInstance);
    container.register(CmsAdvancedSearchPresenter).inSingletonScope();

    return { presenter: container.resolve(Abstraction), listTargets, set, clear };
};

describe("CmsAdvancedSearchPresenter", () => {
    it("lists the admin users as authors, named by name, email or id", async () => {
        const { presenter } = createPresenter();

        await presenter.loadAuthors();

        expect(presenter.vm.authors).toEqual([
            { id: "user-1", displayName: "Adam Jones" },
            { id: "user-2", displayName: "nameless@webiny.com" },
            { id: "user-3", displayName: "user-3" }
        ]);
    });

    it("offers no Author field until there are authors", async () => {
        const { presenter } = createPresenter();

        expect(presenter.vm.fields.map(field => field.id)).not.toContain("createdBy");

        await presenter.loadAuthors();

        expect(presenter.vm.fields.map(field => field.id)).toContain("createdBy");
    });

    it("asks again on every load, so a failed request is retried", async () => {
        const { presenter, listTargets } = createPresenter();
        listTargets.mockRejectedValueOnce(new Error("Network error"));

        await presenter.loadAuthors();
        expect(presenter.vm.authors).toEqual([]);

        await presenter.loadAuthors();
        expect(listTargets).toHaveBeenCalledTimes(2);
        expect(presenter.vm.authors).toHaveLength(3);
    });

    it("clears the keys of the previous filter that the new filter does not have", () => {
        const { presenter, set, clear } = createPresenter();

        presenter.applyFilter(createFilter(Operation.AND, "rope"));
        expect(set).toHaveBeenCalledWith("AND", expect.any(Array));

        presenter.applyFilter(createFilter(Operation.OR, "climbing"));
        expect(clear).toHaveBeenCalledWith("AND");
        expect(set).toHaveBeenLastCalledWith("OR", expect.any(Array));
    });

    it("clears only its own keys when the filter is removed", () => {
        const { presenter, clear } = createPresenter();

        presenter.applyFilter(createFilter(Operation.AND, "rope"));
        presenter.clearFilter();

        expect(clear.mock.calls).toEqual([["AND"]]);
    });
});
