import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { RecentTenantsRepository } from "./abstractions.js";
import { LocalStorageRecentTenantsRepository } from "./LocalStorageRecentTenantsRepository.js";

const createRepository = () => {
    const store = new Map<string, unknown>();

    const container = new Container();
    container.registerInstance(LocalStorage, {
        get: <T>(key: string) => store.get(key) as T | undefined,
        set: <T>(key: string, value: T) => {
            store.set(key, value);
        },
        remove: (key: string) => {
            store.delete(key);
        },
        clear: () => store.clear(),
        keys: () => [...store.keys()]
    });
    container.register(LocalStorageRecentTenantsRepository).inSingletonScope();

    return container.resolve(RecentTenantsRepository);
};

const tenant = (id: string) => {
    return { id, name: `Tenant ${id}`, logo: null };
};

describe("LocalStorageRecentTenantsRepository", () => {
    it("lists nothing before the first switch", () => {
        const repository = createRepository();

        expect(repository.list()).toEqual([]);
    });

    it("puts the latest tenant first, once", () => {
        const repository = createRepository();

        repository.remember(tenant("a"));
        repository.remember(tenant("b"));
        repository.remember(tenant("a"));

        expect(repository.list().map(recent => recent.id)).toEqual(["a", "b"]);
    });

    it("keeps five", () => {
        const repository = createRepository();

        for (const id of ["a", "b", "c", "d", "e", "f"]) {
            repository.remember(tenant(id));
        }

        expect(repository.list().map(recent => recent.id)).toEqual(["f", "e", "d", "c", "b"]);
    });

    it("never stores Root", () => {
        const repository = createRepository();

        repository.remember(tenant("root"));

        expect(repository.list()).toEqual([]);
    });
});
