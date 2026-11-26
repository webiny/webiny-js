import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Operation } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { ListUsersWhoCanReadEntriesUseCase } from "~/features/contentEntry/listUsersWhoCanReadEntries/abstractions.js";
import { ContentEntriesPresenter } from "~/presentation/contentEntries/list/abstractions.js";
import { CmsAdvancedSearchPresenter as Abstraction } from "./abstractions.js";
import { CmsAdvancedSearchPresenter } from "./CmsAdvancedSearchPresenter.js";

const READERS: ListUsersWhoCanReadEntriesUseCase.Reader[] = [
    { id: "user-1", displayName: "Adam Jones" },
    { id: "user-2", displayName: "Beth Smith" },
    { id: "user-3", displayName: "user-3" }
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
    const listReaders = vi.fn(async (_modelId: string) => READERS);
    const set = vi.fn();
    const clear = vi.fn();
    const contentEntries = {
        vm: { model: { modelId: "class", fields: [] } },
        list: { actions: { filter: { set, clear } } }
    };

    const container = new Container();
    container.registerInstance(ListUsersWhoCanReadEntriesUseCase, { execute: listReaders });
    const contentEntriesInstance = contentEntries as unknown as ContentEntriesPresenter.Interface;
    container.registerInstance(ContentEntriesPresenter, contentEntriesInstance);
    container.register(CmsAdvancedSearchPresenter).inSingletonScope();

    return { presenter: container.resolve(Abstraction), contentEntries, listReaders, set, clear };
};

describe("CmsAdvancedSearchPresenter", () => {
    it("lists the users who can read the current model's entries as authors", async () => {
        const { presenter, listReaders } = createPresenter();

        await presenter.loadAuthors();

        expect(listReaders).toHaveBeenCalledWith("class");
        expect(presenter.vm.authors).toEqual(READERS);
    });

    it("offers no authors of the previous model after the model changes", async () => {
        const { presenter, contentEntries, listReaders } = createPresenter();
        await presenter.loadAuthors();

        contentEntries.vm.model = { modelId: "student", fields: [] };
        expect(presenter.vm.authors).toEqual([]);

        listReaders.mockResolvedValueOnce([{ id: "user-2", displayName: "Beth Smith" }]);
        await presenter.loadAuthors();

        expect(listReaders).toHaveBeenLastCalledWith("student");
        expect(presenter.vm.authors).toEqual([{ id: "user-2", displayName: "Beth Smith" }]);
    });

    it("offers no Author field until there are authors", async () => {
        const { presenter } = createPresenter();

        expect(presenter.vm.fields.map(field => field.id)).not.toContain("createdBy");

        await presenter.loadAuthors();

        expect(presenter.vm.fields.map(field => field.id)).toContain("createdBy");
    });

    it("asks again on every load, so a failed request is retried", async () => {
        const { presenter, listReaders } = createPresenter();
        listReaders.mockRejectedValueOnce(new Error("Network error"));

        await presenter.loadAuthors();
        expect(presenter.vm.authors).toEqual([]);

        await presenter.loadAuthors();
        expect(listReaders).toHaveBeenCalledTimes(2);
        expect(presenter.vm.authors).toHaveLength(3);
    });

    it("keeps the result of the newest load when an older one fails later", async () => {
        const { presenter, listReaders } = createPresenter();
        let failOlderLoad: (error: Error) => void = () => {};
        const olderLoad = new Promise<typeof READERS>((_, reject) => {
            failOlderLoad = reject;
        });
        listReaders.mockReturnValueOnce(olderLoad);

        const older = presenter.loadAuthors();
        await presenter.loadAuthors();
        failOlderLoad(new Error("Network error"));
        await older;

        expect(presenter.vm.authors).toHaveLength(3);
    });

    it("keeps the last authors when a load fails", async () => {
        const { presenter, listReaders } = createPresenter();
        await presenter.loadAuthors();

        listReaders.mockRejectedValueOnce(new Error("Network error"));
        await presenter.loadAuthors();

        expect(presenter.vm.authors).toEqual(READERS);
    });

    it("offers a model's authors again at once when the list switches back to it", async () => {
        const { presenter, contentEntries, listReaders } = createPresenter();
        await presenter.loadAuthors();

        contentEntries.vm.model = { modelId: "student", fields: [] };
        listReaders.mockResolvedValueOnce([{ id: "user-2", displayName: "Beth Smith" }]);
        await presenter.loadAuthors();

        contentEntries.vm.model = { modelId: "class", fields: [] };
        expect(presenter.vm.authors).toEqual(READERS);
    });

    it("never offers a late answer for one model on another", async () => {
        const { presenter, contentEntries, listReaders } = createPresenter();
        let answerClassLoad: (readers: typeof READERS) => void = () => {};
        const classLoad = new Promise<typeof READERS>(resolve => {
            answerClassLoad = resolve;
        });
        listReaders.mockReturnValueOnce(classLoad);
        const older = presenter.loadAuthors();

        contentEntries.vm.model = { modelId: "student", fields: [] };
        listReaders.mockResolvedValueOnce([{ id: "user-2", displayName: "Beth Smith" }]);
        await presenter.loadAuthors();
        answerClassLoad(READERS);
        await older;

        expect(presenter.vm.authors).toEqual([{ id: "user-2", displayName: "Beth Smith" }]);
        contentEntries.vm.model = { modelId: "class", fields: [] };
        expect(presenter.vm.authors).toEqual(READERS);
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
