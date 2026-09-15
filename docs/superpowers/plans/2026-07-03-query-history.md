# Query History Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a query history module to the GraphQL Playground that records executed queries and lets users browse, search, delete, and restore them.

**Architecture:** A `QueryHistoryRepository` feature persists history entries to localStorage. A `QueryHistoryPresenter` manages drawer UI state. `PlaygroundPresenter` records entries on execution and exposes restore methods. `PlaygroundPage` bridges the two presenters via MobX reactions.

**Tech Stack:** TypeScript, MobX, React, Vitest, `@webiny/feature/admin` DI abstractions, `@webiny/stdlib` uuid.

## Global Constraints

- Named exports only — no default exports.
- One import per line (one identifier per line).
- `/* */` comment style, not `/** */`.
- Class properties always have `public`/`protected`/`private` + `readonly` modifiers where applicable.
- No `??` or `??=` operators — use `||` and explicit if-checks.
- No `React.FC` — plain arrow functions with typed props.
- Namespace pattern: `export namespace Foo { export type Interface = IFoo }`.
- ID generation: `import { uuid } from "@webiny/stdlib"`.
- Test runner: `yarn test packages/app-graphql-playground`.
- Pre-commit: run lint, format, build checks per CLAUDE.md.

---

### Task 1: QueryHistoryRepository — abstractions and implementation

**Files:**
- Create: `src/features/queryHistory/abstractions.ts`
- Create: `src/features/queryHistory/QueryHistoryRepository.ts`
- Create: `src/features/queryHistory/feature.ts`
- Create: `src/features/queryHistory/index.ts`
- Test: `__tests__/QueryHistoryRepository.test.ts`

**Interfaces:**
- Consumes: `LocalStorage` from `@webiny/app/features/localStorage/abstractions.js`, `uuid` from `@webiny/stdlib`
- Produces: `QueryHistoryRepository` abstraction token, `IQueryHistoryRepository` interface, `IHistoryEntry` interface, `QueryHistoryRepositoryFeature`, `DefaultQueryHistoryRepository`

All paths below are relative to `packages/app-graphql-playground/`.

- [ ] **Step 1: Create abstractions.ts**

```ts
/* src/features/queryHistory/abstractions.ts */
import { createAbstraction } from "@webiny/feature/admin";

export interface IHistoryEntry {
    id: string;
    query: string;
    variables: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
}

export interface IQueryHistoryRepository {
    record(entry: Omit<IHistoryEntry, "id" | "timestamp">): void;
    remove(id: string): void;
    clear(): void;
    getAll(): IHistoryEntry[];
}

export const QueryHistoryRepository =
    createAbstraction<IQueryHistoryRepository>("QueryHistoryRepository");

export namespace QueryHistoryRepository {
    export type Interface = IQueryHistoryRepository;
    export type Entry = IHistoryEntry;
}
```

- [ ] **Step 2: Write failing tests**

```ts
/* __tests__/QueryHistoryRepository.test.ts */
import {
    describe,
    it,
    expect,
    beforeEach
} from "vitest";
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

function createRepository(
    localStorage = createMockLocalStorage()
): IQueryHistoryRepository {
    const Ctor = DefaultQueryHistoryRepository as any;
    return new Ctor(localStorage) as IQueryHistoryRepository;
}

function makeEntry(overrides: Partial<{ query: string; variables: string; endpoint: string; definitionId: string }> = {}) {
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test packages/app-graphql-playground -- --run -t "QueryHistoryRepository" 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement QueryHistoryRepository**

```ts
/* src/features/queryHistory/QueryHistoryRepository.ts */
import { uuid } from "@webiny/stdlib";
import { LocalStorage } from "@webiny/app/features/localStorage/abstractions.js";
import { QueryHistoryRepository } from "./abstractions.js";
import type { IHistoryEntry } from "./abstractions.js";

const STORAGE_KEY = "graphql-playground-history";
const MAX_ENTRIES = 100;

class QueryHistoryRepositoryImpl implements QueryHistoryRepository.Interface {
    private readonly localStorage: LocalStorage.Interface;

    constructor(localStorage: LocalStorage.Interface) {
        this.localStorage = localStorage;
    }

    public record(entry: Omit<IHistoryEntry, "id" | "timestamp">): void {
        const entries = this.readEntries();
        const dedupKey = this.buildDedupKey(entry);

        const existingIndex = entries.findIndex(
            e => this.buildDedupKey(e) === dedupKey
        );

        if (existingIndex !== -1) {
            entries.splice(existingIndex, 1);
        }

        entries.unshift({
            ...entry,
            id: uuid(),
            timestamp: Date.now()
        });

        if (entries.length > MAX_ENTRIES) {
            entries.length = MAX_ENTRIES;
        }

        this.writeEntries(entries);
    }

    public remove(id: string): void {
        const entries = this.readEntries();
        const filtered = entries.filter(e => e.id !== id);
        this.writeEntries(filtered);
    }

    public clear(): void {
        this.writeEntries([]);
    }

    public getAll(): IHistoryEntry[] {
        return this.readEntries();
    }

    private readEntries(): IHistoryEntry[] {
        try {
            const data = this.localStorage.get<IHistoryEntry[]>(STORAGE_KEY);
            if (!data || !Array.isArray(data)) {
                return [];
            }
            return data;
        } catch {
            return [];
        }
    }

    private writeEntries(entries: IHistoryEntry[]): void {
        this.localStorage.set(STORAGE_KEY, entries);
    }

    private buildDedupKey(entry: { query: string; variables: string; endpoint: string }): string {
        return `${entry.query}\0${entry.variables}\0${entry.endpoint}`;
    }
}

export const DefaultQueryHistoryRepository = QueryHistoryRepository.createImplementation({
    implementation: QueryHistoryRepositoryImpl,
    dependencies: [LocalStorage]
});
```

- [ ] **Step 5: Create feature.ts and index.ts**

```ts
/* src/features/queryHistory/feature.ts */
import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryRepository } from "./abstractions.js";
import { DefaultQueryHistoryRepository } from "./QueryHistoryRepository.js";

export const QueryHistoryRepositoryFeature = createFeature({
    name: "QueryHistoryRepository",
    register(container) {
        container.register(DefaultQueryHistoryRepository).inSingletonScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(QueryHistoryRepository)
        };
    }
});
```

```ts
/* src/features/queryHistory/index.ts */
export { QueryHistoryRepository } from "./abstractions.js";
export { QueryHistoryRepositoryFeature } from "./feature.js";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `yarn test packages/app-graphql-playground -- --run -t "QueryHistoryRepository" 2>&1 | tail -20`
Expected: all 7 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(app-graphql-playground): add QueryHistoryRepository feature"
```

---

### Task 2: QueryHistoryPresenter — abstractions and implementation

**Files:**
- Create: `src/presentation/QueryHistory/abstractions.ts`
- Create: `src/presentation/QueryHistory/QueryHistoryPresenter.ts`
- Create: `src/presentation/QueryHistory/feature.ts`
- Create: `src/presentation/QueryHistory/index.ts`
- Test: `__tests__/QueryHistoryPresenter.test.ts`

**Interfaces:**
- Consumes: `QueryHistoryRepository` from Task 1
- Produces: `QueryHistoryPresenter` abstraction token, `IQueryHistoryPresenter`, `IQueryHistoryVm`, `IHistoryEntryVm`, `QueryHistoryFeature`, `DefaultQueryHistoryPresenter`

- [ ] **Step 1: Create abstractions.ts**

```ts
/* src/presentation/QueryHistory/abstractions.ts */
import { createAbstraction } from "@webiny/feature/admin";

export interface IHistoryEntryVm {
    id: string;
    queryPreview: string;
    endpoint: string;
    definitionId: string;
    timestamp: number;
    query: string;
    variables: string;
}

export interface IQueryHistoryVm {
    open: boolean;
    searchQuery: string;
    entries: IHistoryEntryVm[];
}

export interface IQueryHistoryPresenter {
    readonly vm: IQueryHistoryVm;
    toggle(): void;
    setSearchQuery(query: string): void;
    remove(id: string): void;
    clear(): void;
    load(): void;
    refresh(): void;
}

export const QueryHistoryPresenter =
    createAbstraction<IQueryHistoryPresenter>("QueryHistoryPresenter");

export namespace QueryHistoryPresenter {
    export type Interface = IQueryHistoryPresenter;
    export type Vm = IQueryHistoryVm;
    export type EntryVm = IHistoryEntryVm;
}
```

- [ ] **Step 2: Write failing tests**

```ts
/* __tests__/QueryHistoryPresenter.test.ts */
import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";
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

function createPresenter(
    repository: IQueryHistoryRepository
): IQueryHistoryPresenter {
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
            const longQuery = "query GetAllTheThingsWithAVeryLongName { items { id title description body author { name email } tags { label } } }";
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

            repo.record({ query: "{ new }", variables: "", endpoint: "/gql", definitionId: "main" });
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test packages/app-graphql-playground -- --run -t "QueryHistoryPresenter" 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement QueryHistoryPresenter**

```ts
/* src/presentation/QueryHistory/QueryHistoryPresenter.ts */
import { makeAutoObservable } from "mobx";
import { QueryHistoryRepository } from "../../features/queryHistory/abstractions.js";
import { QueryHistoryPresenter } from "./abstractions.js";
import type { IHistoryEntry } from "../../features/queryHistory/abstractions.js";
import type { IHistoryEntryVm } from "./abstractions.js";

const PREVIEW_MAX_LENGTH = 80;

class QueryHistoryPresenterImpl implements QueryHistoryPresenter.Interface {
    private isOpen = false;
    private search = "";
    private entries: IHistoryEntry[] = [];
    private readonly repository: QueryHistoryRepository.Interface;

    constructor(repository: QueryHistoryRepository.Interface) {
        this.repository = repository;
        makeAutoObservable<QueryHistoryPresenterImpl, "repository">(this, {
            repository: false
        }, { autoBind: true });
    }

    public get vm(): QueryHistoryPresenter.Vm {
        return {
            open: this.isOpen,
            searchQuery: this.search,
            entries: this.buildFilteredEntries()
        };
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
    }

    public setSearchQuery(query: string): void {
        this.search = query;
    }

    public remove(id: string): void {
        this.repository.remove(id);
        this.readFromRepository();
    }

    public clear(): void {
        this.repository.clear();
        this.readFromRepository();
    }

    public load(): void {
        this.readFromRepository();
    }

    public refresh(): void {
        this.readFromRepository();
    }

    private readFromRepository(): void {
        this.entries = this.repository.getAll();
    }

    private buildFilteredEntries(): IHistoryEntryVm[] {
        const lowerSearch = this.search.toLowerCase();

        return this.entries
            .filter(entry => {
                if (this.search === "") {
                    return true;
                }
                return entry.query.toLowerCase().includes(lowerSearch);
            })
            .map(entry => this.toEntryVm(entry));
    }

    private toEntryVm(entry: IHistoryEntry): IHistoryEntryVm {
        const trimmed = entry.query.trim();
        const preview = trimmed.length > PREVIEW_MAX_LENGTH
            ? trimmed.slice(0, PREVIEW_MAX_LENGTH) + "..."
            : trimmed;

        return {
            id: entry.id,
            queryPreview: preview,
            endpoint: entry.endpoint,
            definitionId: entry.definitionId,
            timestamp: entry.timestamp,
            query: entry.query,
            variables: entry.variables
        };
    }
}

export const DefaultQueryHistoryPresenter = QueryHistoryPresenter.createImplementation({
    implementation: QueryHistoryPresenterImpl,
    dependencies: [QueryHistoryRepository]
});
```

- [ ] **Step 5: Create feature.ts and index.ts**

```ts
/* src/presentation/QueryHistory/feature.ts */
import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { QueryHistoryPresenter } from "./abstractions.js";
import { DefaultQueryHistoryPresenter } from "./QueryHistoryPresenter.js";

export const QueryHistoryFeature = createFeature({
    name: "QueryHistoryPresenter",
    register(container) {
        container.register(DefaultQueryHistoryPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(QueryHistoryPresenter)
        };
    }
});
```

```ts
/* src/presentation/QueryHistory/index.ts */
export { QueryHistoryPresenter } from "./abstractions.js";
export { QueryHistoryFeature } from "./feature.js";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `yarn test packages/app-graphql-playground -- --run -t "QueryHistoryPresenter" 2>&1 | tail -20`
Expected: all 8 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(app-graphql-playground): add QueryHistoryPresenter"
```

---

### Task 3: Integrate history recording into PlaygroundPresenter

**Files:**
- Modify: `src/presentation/Playground/PlaygroundPresenter.ts` (constructor, executeQuery, new methods)
- Modify: `src/presentation/Playground/abstractions.ts` (add methods to interface)
- Test: `__tests__/PlaygroundPresenter.test.ts` (add history-related tests)

**Interfaces:**
- Consumes: `QueryHistoryRepository` from Task 1, existing `PlaygroundPresenter` internals
- Produces: Updated `IPlaygroundPresenter` with `restoreFromHistory(query, variables)` and `restoreFromHistoryInNewTab(query, variables, endpoint, definitionId)`

- [ ] **Step 1: Add methods to abstractions.ts**

Add to `IPlaygroundPresenter` interface:

```ts
restoreFromHistory(query: string, variables: string): void;
restoreFromHistoryInNewTab(
    query: string,
    variables: string,
    endpoint: string,
    definitionId: string
): void;
```

- [ ] **Step 2: Write failing tests in PlaygroundPresenter.test.ts**

Add to the existing test file, after the existing describes:

```ts
describe("history recording", () => {
    it("should record a history entry after successful query execution", async () => {
        const mockHistoryRepo = { record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository,
            historyRepository: mockHistoryRepo
        });
        presenter.init();
        presenter.executeQuery();

        await vi.advanceTimersByTimeAsync(0);

        expect(mockHistoryRepo.record).toHaveBeenCalledWith(
            expect.objectContaining({
                query: expect.any(String),
                variables: expect.any(String),
                endpoint: expect.any(String),
                definitionId: expect.any(String)
            })
        );
    });

    it("should record a history entry after failed query execution", async () => {
        const failClient = { execute: vi.fn().mockRejectedValue(new Error("network")) };
        const failRegistry = createMockRegistry(failClient);
        const mockHistoryRepo = { record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
        const presenter = createPresenter({
            registry: failRegistry,
            repository: mockRepository,
            historyRepository: mockHistoryRepo
        });
        presenter.init();
        presenter.executeQuery();

        await vi.advanceTimersByTimeAsync(0);

        expect(mockHistoryRepo.record).toHaveBeenCalled();
    });

    it("should not crash if history record throws", async () => {
        const badHistoryRepo = {
            record: vi.fn().mockImplementation(() => { throw new Error("quota exceeded"); }),
            remove: vi.fn(),
            clear: vi.fn(),
            getAll: vi.fn().mockReturnValue([])
        };
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository,
            historyRepository: badHistoryRepo
        });
        presenter.init();
        presenter.executeQuery();

        await vi.advanceTimersByTimeAsync(0);

        expect(presenter.vm.activeTab!.response).toContain("test");
        expect(presenter.vm.activeTab!.isExecuting).toBe(false);
    });
});

describe("restoreFromHistory", () => {
    it("should overwrite active tab query and variables", () => {
        const mockHistoryRepo = { record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository,
            historyRepository: mockHistoryRepo
        });
        presenter.init();

        presenter.restoreFromHistory("{ restored }", '{"x":1}');

        expect(presenter.vm.activeTab!.query).toBe("{ restored }");
        expect(presenter.vm.activeTab!.variables).toBe('{"x":1}');
    });
});

describe("restoreFromHistoryInNewTab", () => {
    it("should create a new tab with the given data", () => {
        const mockHistoryRepo = { record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository,
            historyRepository: mockHistoryRepo
        });
        presenter.init();
        const tabCountBefore = presenter.vm.tabs.length;

        presenter.restoreFromHistoryInNewTab(
            "{ restored }",
            '{"x":1}',
            "http://localhost:3000/graphql",
            "main-api"
        );

        expect(presenter.vm.tabs.length).toBe(tabCountBefore + 1);
        expect(presenter.vm.activeTab!.query).toBe("{ restored }");
        expect(presenter.vm.activeTab!.variables).toBe('{"x":1}');
    });

    it("should fall back to first definition if definitionId is unknown", () => {
        const mockHistoryRepo = { record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
        const presenter = createPresenter({
            registry: mockRegistry,
            repository: mockRepository,
            historyRepository: mockHistoryRepo
        });
        presenter.init();

        presenter.restoreFromHistoryInNewTab(
            "{ restored }",
            "",
            "/unknown",
            "deleted-api"
        );

        expect(presenter.vm.activeTab!.query).toBe("{ restored }");
    });
});
```

Note: The `createPresenter` helper in the existing test file needs to be updated to accept an optional `historyRepository` param. Update it to:

```ts
function createPresenter(params: {
    registry: PlaygroundTabRegistry.Interface;
    repository: PlaygroundRepository.Interface;
    historyRepository?: IQueryHistoryRepository;
}): IPlaygroundPresenter {
    const Ctor = DefaultPlaygroundPresenter as any;
    const historyRepo = params.historyRepository || {
        record: vi.fn(), remove: vi.fn(), clear: vi.fn(), getAll: vi.fn().mockReturnValue([])
    };
    const presenter = new Ctor(params.registry, params.repository, historyRepo);
    return presenter as IPlaygroundPresenter;
}
```

Add this import at the top of the test file:

```ts
import type { IQueryHistoryRepository } from "~/features/queryHistory/abstractions";
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn test packages/app-graphql-playground -- --run -t "history recording" 2>&1 | tail -20`
Expected: FAIL — methods don't exist yet.

- [ ] **Step 4: Update PlaygroundPresenter.ts**

Add `QueryHistoryRepository` import and constructor param:

```ts
import { QueryHistoryRepository } from "../../features/queryHistory/abstractions.js";
```

Add third constructor parameter:

```ts
constructor(
    tabRegistry: PlaygroundTabRegistry.Interface,
    repository: PlaygroundRepository.Interface,
    private readonly historyRepository: QueryHistoryRepository.Interface
) {
```

Mark `historyRepository` as `false` in the `makeAutoObservable` exclusions.

Update `executeQuery()` — in the `.then()` handler, inside `runInAction`, after setting `tab.response` but before setting `tab.isExecuting = false`:

```ts
try {
    this.historyRepository.record({
        query: capturedQuery,
        variables: capturedVariables,
        endpoint: capturedEndpoint,
        definitionId: capturedDefinitionId
    });
} catch {
    /* History write failure must not affect the playground. */
}
```

Capture the values before the async call:

```ts
const capturedQuery = tab.query;
const capturedVariables = tab.variables;
const capturedEndpoint = tab.endpoint;
const capturedDefinitionId = tab.definitionId;
```

Same `record` + try/catch pattern in the `.catch()` handler.

Add the two restore methods:

```ts
public restoreFromHistory(query: string, variables: string): void {
    const tab = this.getActiveTab();
    if (!tab) {
        return;
    }

    tab.query = query;
    tab.variables = variables;
}

public restoreFromHistoryInNewTab(
    query: string,
    variables: string,
    endpoint: string,
    definitionId: string
): void {
    let resolvedDefinitionId = definitionId;
    if (!this.definitions.has(definitionId)) {
        const firstKey = this.definitions.keys().next().value;
        if (!firstKey) {
            return;
        }
        resolvedDefinitionId = firstKey;
    }

    const tab = this.buildTab({
        id: this.generateUserTabId(),
        definitionId: resolvedDefinitionId,
        name: "History",
        endpoint,
        query,
        variables,
        headers: "",
        isRegistered: false
    });

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.loadSchema(tab);
}
```

Update `DefaultPlaygroundPresenter` dependencies array:

```ts
export const DefaultPlaygroundPresenter = PlaygroundPresenter.createImplementation({
    implementation: PlaygroundPresenterImpl,
    dependencies: [PlaygroundTabRegistry, PlaygroundRepository, QueryHistoryRepository]
});
```

- [ ] **Step 5: Update abstractions.ts**

Add `restoreFromHistory` and `restoreFromHistoryInNewTab` to `IPlaygroundPresenter`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `yarn test packages/app-graphql-playground 2>&1 | tail -20`
Expected: ALL tests pass (existing + new).

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(app-graphql-playground): integrate history recording into PlaygroundPresenter"
```

---

### Task 4: UI components — QueryHistoryDrawer and wiring

**Files:**
- Create: `src/presentation/QueryHistory/components/QueryHistoryDrawer.tsx`
- Create: `src/presentation/QueryHistory/components/QueryHistoryList.tsx`
- Create: `src/presentation/QueryHistory/components/HistoryEntryRow.tsx`
- Modify: `src/presentation/Playground/components/PlaygroundPage.tsx`
- Modify: `src/presentation/Playground/components/PlaygroundToolbar.tsx`

**Interfaces:**
- Consumes: `QueryHistoryPresenter` from Task 2, `PlaygroundPresenter` (updated) from Task 3, `QueryHistoryFeature`
- Produces: Complete UI wiring — History button in toolbar, drawer, entry rows with restore/new-tab/delete actions, refresh bridge

- [ ] **Step 1: Create HistoryEntryRow.tsx**

```tsx
/* src/presentation/QueryHistory/components/HistoryEntryRow.tsx */
import React from "react";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { QueryHistoryPresenter } from "../abstractions.js";

interface HistoryEntryRowProps {
    entry: QueryHistoryPresenter.EntryVm;
    onRestore: (entry: QueryHistoryPresenter.EntryVm) => void;
    onOpenInNewTab: (entry: QueryHistoryPresenter.EntryVm) => void;
    onRemove: (id: string) => void;
}

const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
        return "just now";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export const HistoryEntryRow = (props: HistoryEntryRowProps) => {
    return (
        <div
            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 group"
            onClick={() => props.onRestore(props.entry)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-gray-800 truncate">
                        {props.entry.queryPreview}
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        <span>{props.entry.endpoint}</span>
                        <span>{formatRelativeTime(props.entry.timestamp)}</span>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                    <button
                        className="p-1 text-gray-400 hover:text-blue-600 bg-transparent border-none cursor-pointer"
                        onClick={ev => {
                            ev.stopPropagation();
                            props.onOpenInNewTab(props.entry);
                        }}
                        title="Open in new tab"
                    >
                        <OpenInNewIcon className="w-4 h-4" />
                    </button>
                    <button
                        className="p-1 text-gray-400 hover:text-red-600 bg-transparent border-none cursor-pointer"
                        onClick={ev => {
                            ev.stopPropagation();
                            props.onRemove(props.entry.id);
                        }}
                        title="Remove"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
```

- [ ] **Step 2: Create QueryHistoryList.tsx**

```tsx
/* src/presentation/QueryHistory/components/QueryHistoryList.tsx */
import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { HistoryEntryRow } from "./HistoryEntryRow.js";
import type { QueryHistoryPresenter } from "../abstractions.js";

interface QueryHistoryListProps {
    presenter: QueryHistoryPresenter.Interface;
    onRestore: (entry: QueryHistoryPresenter.EntryVm) => void;
    onOpenInNewTab: (entry: QueryHistoryPresenter.EntryVm) => void;
}

export const QueryHistoryList = observer((props: QueryHistoryListProps) => {
    const { presenter } = props;
    const { entries, searchQuery } = presenter.vm;

    return (
        <div>
            <div className="p-3 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={ev => presenter.setSearchQuery(ev.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {entries.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400 italic">
                        {searchQuery ? "No matching entries." : "No history yet."}
                    </div>
                ) : (
                    entries.map(entry => (
                        <HistoryEntryRow
                            key={entry.id}
                            entry={entry}
                            onRestore={props.onRestore}
                            onOpenInNewTab={props.onOpenInNewTab}
                            onRemove={id => presenter.remove(id)}
                        />
                    ))
                )}
            </div>
            {entries.length > 0 ? (
                <div className="p-3 border-t border-gray-200">
                    <Button
                        onClick={() => presenter.clear()}
                        variant="secondary"
                        size="sm"
                    >
                        Clear All
                    </Button>
                </div>
            ) : null}
        </div>
    );
});
```

- [ ] **Step 3: Create QueryHistoryDrawer.tsx**

```tsx
/* src/presentation/QueryHistory/components/QueryHistoryDrawer.tsx */
import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { QueryHistoryList } from "./QueryHistoryList.js";
import type { QueryHistoryPresenter } from "../abstractions.js";
import type { PlaygroundPresenter } from "../../Playground/abstractions.js";

interface QueryHistoryDrawerProps {
    presenter: QueryHistoryPresenter.Interface;
    playgroundPresenter: PlaygroundPresenter.Interface;
}

export const QueryHistoryDrawer = observer((props: QueryHistoryDrawerProps) => {
    const { presenter, playgroundPresenter } = props;

    const handleRestore = (entry: QueryHistoryPresenter.EntryVm) => {
        playgroundPresenter.restoreFromHistory(entry.query, entry.variables);
    };

    const handleOpenInNewTab = (entry: QueryHistoryPresenter.EntryVm) => {
        playgroundPresenter.restoreFromHistoryInNewTab(
            entry.query,
            entry.variables,
            entry.endpoint,
            entry.definitionId
        );
    };

    return (
        <Drawer
            title="Query History"
            open={presenter.vm.open}
            onOpenChange={open => {
                if (open) {
                    return;
                }
                presenter.toggle();
            }}
            modal={false}
            bodyPadding={false}
            headerSeparator={true}
            width={"40%"}
        >
            <QueryHistoryList
                presenter={presenter}
                onRestore={handleRestore}
                onOpenInNewTab={handleOpenInNewTab}
            />
        </Drawer>
    );
});
```

- [ ] **Step 4: Update PlaygroundToolbar.tsx**

Add History button. Import the icon and the `QueryHistoryPresenter` type:

```tsx
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import type { QueryHistoryPresenter } from "../../QueryHistory/abstractions.js";
```

Add `historyPresenter` to `PlaygroundToolbarProps`:

```tsx
interface PlaygroundToolbarProps {
    presenter: PlaygroundPresenter.Interface;
    docsPresenter: DocsExplorerPresenter.Interface;
    historyPresenter: QueryHistoryPresenter.Interface;
}
```

Add the History button in the toolbar, right before the Docs button:

```tsx
<Button
    onClick={() => props.historyPresenter.toggle()}
    icon={<HistoryIcon />}
    variant={props.historyPresenter.vm.open ? "primary" : "secondary"}
>
    History
</Button>
```

- [ ] **Step 5: Update PlaygroundPage.tsx**

Import the new feature and drawer:

```tsx
import { QueryHistoryFeature } from "../../QueryHistory/feature.js";
import { QueryHistoryDrawer } from "../../QueryHistory/components/QueryHistoryDrawer.js";
```

Resolve the history presenter:

```tsx
const { presenter: historyPresenter } = useFeature(QueryHistoryFeature);
```

Add a useEffect for initial load:

```tsx
useEffect(() => {
    historyPresenter.load();
}, [historyPresenter]);
```

Add a useEffect for the refresh bridge — watch for `isExecuting` transitions:

```tsx
useEffect(() => {
    const activeTab = presenter.vm.activeTab;
    if (activeTab && !activeTab.isExecuting) {
        historyPresenter.refresh();
    }
}, [presenter.vm.activeTab?.isExecuting, historyPresenter]);
```

Pass `historyPresenter` to the toolbar:

```tsx
<PlaygroundToolbar
    presenter={presenter}
    docsPresenter={docsPresenter}
    historyPresenter={historyPresenter}
/>
```

Render `QueryHistoryDrawer` alongside `DocsExplorerDrawer`:

```tsx
<DocsExplorerDrawer presenter={docsPresenter} />
<QueryHistoryDrawer presenter={historyPresenter} playgroundPresenter={presenter} />
```

- [ ] **Step 6: Register the features in the app**

Check where `DocsExplorerFeature` and `PlaygroundRepositoryFeature` are registered. The `QueryHistoryRepositoryFeature` and `QueryHistoryFeature` need to be registered in the same location. Look at `src/index.tsx` or wherever features are composed and add:

```tsx
import { QueryHistoryRepositoryFeature } from "./features/queryHistory/index.js";
import { QueryHistoryFeature } from "./presentation/QueryHistory/index.js";
```

Register both features alongside the existing ones.

- [ ] **Step 7: Run all tests**

Run: `yarn test packages/app-graphql-playground 2>&1 | tail -30`
Expected: ALL tests pass.

- [ ] **Step 8: Run pre-commit checks**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat(app-graphql-playground): add query history UI and PlaygroundPage wiring"
```
