import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { SaveMyDashboardRepository as RepositoryAbstraction } from "./abstractions.js";
import { DashboardPersistenceError } from "~/domain/errors.js";
import { createDashboardKey } from "~/domain/dashboardKey.js";
import type { DashboardLayout } from "~/domain/types.js";

class SaveMyDashboardRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async save(
        ownerId: string,
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, RepositoryAbstraction.Error>> {
        const key = createDashboardKey(ownerId);
        const result = await this.keyValueStore.set(key, layout);
        if (result.isFail()) {
            return Result.fail(new DashboardPersistenceError(result.error));
        }

        return Result.ok(layout);
    }
}

export const SaveMyDashboardRepository = RepositoryAbstraction.createImplementation({
    implementation: SaveMyDashboardRepositoryImpl,
    dependencies: [KeyValueStore]
});
