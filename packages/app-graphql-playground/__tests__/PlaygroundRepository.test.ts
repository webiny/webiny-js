import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LocalStorage } from "@webiny/app/features/localStorage/abstractions";
import type { PlaygroundRepository } from "~/features/repository/abstractions";
import { DefaultPlaygroundRepository } from "~/features/repository/PlaygroundRepository";

function createMockStorage(): LocalStorage.Interface & {
    store: Map<string, unknown>;
} {
    const store = new Map<string, unknown>();

    return {
        store,
        get: vi.fn(<T>(key: string): T | undefined => {
            if (!store.has(key)) {
                return undefined;
            }
            return store.get(key) as T;
        }),
        set: vi.fn(<T>(key: string, value: T): void => {
            store.set(key, value);
        }),
        remove: vi.fn((key: string): void => {
            store.delete(key);
        }),
        clear: vi.fn((): void => {
            store.clear();
        }),
        keys: vi.fn((): string[] => {
            return Array.from(store.keys());
        })
    };
}

function createRepository(storage: LocalStorage.Interface): PlaygroundRepository.Interface {
    const Ctor = DefaultPlaygroundRepository as any;
    return new Ctor(storage) as PlaygroundRepository.Interface;
}

describe("PlaygroundRepository", () => {
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
        mockStorage = createMockStorage();
    });

    describe("save() + load() round-trip", () => {
        it("should save and load state correctly", () => {
            const repository = createRepository(mockStorage);

            const state: PlaygroundRepository.PersistedState = {
                activeTabId: "main-api",
                registeredTabs: [
                    {
                        definitionId: "main-api",
                        query: "{ listItems { id } }",
                        variables: '{ "limit": 10 }'
                    }
                ],
                userTabs: [
                    {
                        id: "user-1",
                        definitionId: "main-api",
                        name: "My Tab",
                        endpoint: "http://localhost/graphql",
                        query: "{ customQuery }",
                        variables: ""
                    }
                ]
            };

            repository.save(state);
            const loaded = repository.load();

            expect(loaded).toEqual(state);
        });
    });

    describe("load()", () => {
        it("should return null when no stored data exists", () => {
            const repository = createRepository(mockStorage);

            const result = repository.load();

            expect(result).toBeNull();
        });

        it("should return null when storage returns undefined", () => {
            mockStorage.get = vi.fn().mockReturnValue(undefined);
            const repository = createRepository(mockStorage);

            const result = repository.load();

            expect(result).toBeNull();
        });

        it("should return null on corrupt data without throwing", () => {
            mockStorage.get = vi.fn().mockImplementation(() => {
                throw new Error("Storage read failure");
            });
            const repository = createRepository(mockStorage);

            const result = repository.load();

            expect(result).toBeNull();
        });
    });

    describe("storage key", () => {
        it("should use the key 'graphql-playground'", () => {
            const repository = createRepository(mockStorage);

            const state: PlaygroundRepository.PersistedState = {
                activeTabId: "test",
                registeredTabs: [],
                userTabs: []
            };

            repository.save(state);

            expect(mockStorage.set).toHaveBeenCalledWith("graphql-playground", state);
        });

        it("should load from the key 'graphql-playground'", () => {
            const repository = createRepository(mockStorage);

            repository.load();

            expect(mockStorage.get).toHaveBeenCalledWith("graphql-playground");
        });
    });
});
