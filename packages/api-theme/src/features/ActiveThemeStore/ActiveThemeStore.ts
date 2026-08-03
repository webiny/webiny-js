import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ActiveThemeStore as StoreAbstraction } from "./abstractions.js";
import { ACTIVE_THEME_KEY } from "~/constants.js";
import type { ActiveThemePointer } from "~/domain/theme/abstractions.js";
import { ThemePersistenceError } from "~/domain/theme/errors.js";

class ActiveThemeStoreImpl implements StoreAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async get() {
        const result = await this.keyValueStore.get<ActiveThemePointer>(ACTIVE_THEME_KEY);

        if (result.isFail()) {
            // An absent key is the normal "no theme active" state, not a failure.
            if (result.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok<ActiveThemePointer | null>(null);
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok<ActiveThemePointer | null>(result.value ?? null);
    }

    async set(pointer: ActiveThemePointer) {
        const result = await this.keyValueStore.set(ACTIVE_THEME_KEY, pointer);

        if (result.isFail()) {
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok();
    }

    async clear() {
        const result = await this.keyValueStore.delete(ACTIVE_THEME_KEY);

        if (result.isFail()) {
            if (result.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok();
            }
            return Result.fail(new ThemePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const ActiveThemeStore = StoreAbstraction.createImplementation({
    implementation: ActiveThemeStoreImpl,
    dependencies: [KeyValueStore]
});
