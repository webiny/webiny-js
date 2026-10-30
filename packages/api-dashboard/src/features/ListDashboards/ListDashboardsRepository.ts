import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ListDashboardsRepository as RepositoryAbstraction } from "./abstractions.js";
import { DashboardPersistenceError } from "~/domain/errors.js";
import { createDashboardKey } from "~/domain/dashboardKey.js";
import type { DashboardLayout } from "~/domain/types.js";

class ListDashboardsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async get(
        ownerId: string
    ): Promise<Result<DashboardLayout | null, RepositoryAbstraction.Error>> {
        const key = createDashboardKey(ownerId);
        const result = await this.keyValueStore.get<DashboardLayout>(key);
        if (result.isFail()) {
            if (result.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok(null);
            }
            return Result.fail(new DashboardPersistenceError(result.error));
        }

        return Result.ok(result.value);
    }
}

export const ListDashboardsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListDashboardsRepositoryImpl,
    dependencies: [KeyValueStore]
});
