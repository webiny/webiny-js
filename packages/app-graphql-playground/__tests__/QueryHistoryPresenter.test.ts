import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { vi } from "vitest";
import { DefaultQueryHistoryPresenter } from "~/presentation/QueryHistory/QueryHistoryPresenter";
import type { IQueryHistoryPresenter } from "~/presentation/QueryHistory/abstractions";
import type { IQueryHistoryRepository } from "~/features/queryHistory/abstractions";
import type { IHistoryEntry } from "~/features/queryHistory/abstractions";

function createMockRepository(entries: IHistoryEntry[] = []): IQueryHistoryRepository {
    let store = [...entries];
    return {
        record: vi.fn((entry: Omit<IHistoryEntry, "id" | "timestamp">) => {
            store.unshift({ ...entry, id: `id-${store.length}`, timestamp: Date.now() });
        }),
        remove: vi.fn((id: string) => {
            store = store.filter(e => e.id !== id);
        }),
        clear: vi.fn(() => {
            store = [];
        }),
        getAll: vi.fn(() => [...store])
    };
}

function createPresenter(repository: IQueryHistoryRepository): IQueryHistoryPresenter {
    const Ctor = DefaultQueryHistoryPresenter as any;
    return new Ctor(repository) as IQueryHistoryPresenter;
}

function makeHistoryEntry(overrides: Partial<IHistoryEntry> = {}): IHistoryEntry {
    return {
        id: overrides.id || "entry-1",
        query: overrides.query || "{ listPosts { id } }",
        variables: overrides.variables || "",
        endpoint: overrides.endpoint || "/graphql",
        definitionId: overrides.definitionId || "main-api",
        timestamp: overrides.timestamp || 1000000
    };
}

describe("QueryHistoryPresenter", () => {
    let repo: IQueryHistoryRepository;
    let presenter: IQueryHistoryPresenter;

    beforeEach(() => {
        repo = createMockRepository();
        presenter = createPresenter(repo);
    });

    describe("toggle", () => {
        it("should open and close the drawer", () => {
            expect(presenter.vm.open).toBe(false);
            presenter.toggle();
            expect(presenter.vm.open).toBe(true);
            presenter.toggle();
            expect(presenter.vm.open).toBe(false);
        });
    });

    describe("load", () => {
        it("should populate entries from repository", () => {
            const entry = makeHistoryEntry();
            repo = createMockRepository([entry]);
            presenter = createPresenter(repo);

            presenter.load();

            expect(presenter.vm.entries).toHaveLength(1);
            expect(presenter.vm.entries[0].query).toBe("{ listPosts { id } }");
        });

        it("should generate queryPreview from the query", () => {
            const longQuery =
                "query GetAllTheThingsWithAVeryLongName { items { id title description body author { name email } tags { label } } }";
            const entry = makeHistoryEntry({ query: longQuery });
            repo = createMockRepository([entry]);
            presenter = createPresenter(repo);

            presenter.load();

            expect(presenter.vm.entries[0].queryPreview.length).toBeLessThanOrEqual(80);
        });
    });

    describe("refresh", () => {
        it("should re-read from repository", () => {
            presenter.load();
            expect(presenter.vm.entries).toHaveLength(0);

            repo.record({
                query: "{ new }",
                variables: "",
                endpoint: "/gql",
                definitionId: "main"
            });
            presenter.refresh();

            expect(presenter.vm.entries).toHaveLength(1);
        });
    });

    describe("setSearchQuery", () => {
        it("should filter entries by query text case-insensitively", () => {
            repo = createMockRepository([
                makeHistoryEntry({ id: "1", query: "{ listPosts { id } }" }),
                makeHistoryEntry({ id: "2", query: "{ getUser { name } }" })
            ]);
            presenter = createPresenter(repo);
            presenter.load();

            presenter.setSearchQuery("post");

            expect(presenter.vm.entries).toHaveLength(1);
            expect(presenter.vm.entries[0].query).toContain("listPosts");
        });

        it("should show all entries when search is cleared", () => {
            repo = createMockRepository([
                makeHistoryEntry({ id: "1", query: "{ a }" }),
                makeHistoryEntry({ id: "2", query: "{ b }" })
            ]);
            presenter = createPresenter(repo);
            presenter.load();

            presenter.setSearchQuery("a");
            expect(presenter.vm.entries).toHaveLength(1);

            presenter.setSearchQuery("");
            expect(presenter.vm.entries).toHaveLength(2);
        });
    });

    describe("remove", () => {
        it("should remove a single entry and refresh", () => {
            repo = createMockRepository([
                makeHistoryEntry({ id: "1", query: "keep" }),
                makeHistoryEntry({ id: "2", query: "delete" })
            ]);
            presenter = createPresenter(repo);
            presenter.load();

            presenter.remove("2");

            expect(repo.remove).toHaveBeenCalledWith("2");
            expect(presenter.vm.entries).toHaveLength(1);
            expect(presenter.vm.entries[0].query).toBe("keep");
        });
    });

    describe("clear", () => {
        it("should remove all entries and refresh", () => {
            repo = createMockRepository([
                makeHistoryEntry({ id: "1" }),
                makeHistoryEntry({ id: "2" })
            ]);
            presenter = createPresenter(repo);
            presenter.load();

            presenter.clear();

            expect(repo.clear).toHaveBeenCalled();
            expect(presenter.vm.entries).toHaveLength(0);
        });
    });
});
