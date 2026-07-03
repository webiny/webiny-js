import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { DefaultQueryHistoryRepository } from "~/features/queryHistory/QueryHistoryRepository";
import type { IQueryHistoryRepository } from "~/features/queryHistory/abstractions";

function createMockLocalStorage() {
    const store = new Map<string, unknown>();
    return {
        get: <T>(key: string) => store.get(key) as T | undefined,
        set: <T>(key: string, value: T) => store.set(key, value),
        remove: (key: string) => store.delete(key),
        clear: () => store.clear(),
        keys: () => Array.from(store.keys())
    };
}

function createRepository(localStorage = createMockLocalStorage()): IQueryHistoryRepository {
    const Ctor = DefaultQueryHistoryRepository as any;
    return new Ctor(localStorage) as IQueryHistoryRepository;
}

interface IEntryOverrides {
    query?: string;
    variables?: string;
    endpoint?: string;
    definitionId?: string;
}

function makeEntry(overrides: IEntryOverrides = {}) {
    return {
        query: overrides.query || "{ listPosts { id } }",
        variables: overrides.variables || "",
        endpoint: overrides.endpoint || "/graphql",
        definitionId: overrides.definitionId || "main-api"
    };
}

describe("QueryHistoryRepository", () => {
    let repo: IQueryHistoryRepository;

    beforeEach(() => {
        repo = createRepository();
    });

    describe("record", () => {
        it("should add an entry with generated id and timestamp", () => {
            repo.record(makeEntry());

            const entries = repo.getAll();
            expect(entries).toHaveLength(1);
            expect(entries[0].id).toBeDefined();
            expect(entries[0].timestamp).toBeGreaterThan(0);
            expect(entries[0].query).toBe("{ listPosts { id } }");
        });

        it("should return entries sorted by timestamp descending", () => {
            repo.record(makeEntry({ query: "first" }));
            repo.record(makeEntry({ query: "second" }));

            const entries = repo.getAll();
            expect(entries[0].query).toBe("second");
            expect(entries[1].query).toBe("first");
        });

        it("should deduplicate by query+variables+endpoint and update timestamp", () => {
            repo.record(makeEntry({ query: "{ same }" }));
            repo.record(makeEntry({ query: "{ other }" }));
            repo.record(makeEntry({ query: "{ same }" }));

            const entries = repo.getAll();
            expect(entries).toHaveLength(2);
            expect(entries[0].query).toBe("{ same }");
        });

        it("should evict oldest entry when exceeding 100", () => {
            for (let i = 0; i < 101; i++) {
                repo.record(makeEntry({ query: `query_${i}` }));
            }

            const entries = repo.getAll();
            expect(entries).toHaveLength(100);
            expect(entries.some(e => e.query === "query_0")).toBe(false);
            expect(entries.some(e => e.query === "query_100")).toBe(true);
        });
    });

    describe("remove", () => {
        it("should remove a single entry by id", () => {
            repo.record(makeEntry({ query: "keep" }));
            repo.record(makeEntry({ query: "delete-me" }));

            const entries = repo.getAll();
            const idToRemove = entries.find(e => e.query === "delete-me")!.id;

            repo.remove(idToRemove);

            const remaining = repo.getAll();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].query).toBe("keep");
        });
    });

    describe("clear", () => {
        it("should remove all entries", () => {
            repo.record(makeEntry({ query: "a" }));
            repo.record(makeEntry({ query: "b" }));
            repo.clear();

            expect(repo.getAll()).toHaveLength(0);
        });
    });

    describe("persistence", () => {
        it("should persist entries across repository instances", () => {
            const localStorage = createMockLocalStorage();
            const repo1 = createRepository(localStorage);
            repo1.record(makeEntry({ query: "persisted" }));

            const repo2 = createRepository(localStorage);
            const entries = repo2.getAll();
            expect(entries).toHaveLength(1);
            expect(entries[0].query).toBe("persisted");
        });
    });
});
