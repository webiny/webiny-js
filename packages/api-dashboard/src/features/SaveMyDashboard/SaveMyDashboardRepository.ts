import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { createIdentifier } from "@webiny/utils";
import { SaveMyDashboardRepository as RepositoryAbstraction } from "./abstractions.js";
import { DashboardModelProvider } from "~/domain/abstractions.js";
import { DashboardLayoutMapper } from "~/domain/DashboardLayoutMapper.js";
import { DashboardPersistenceError } from "~/domain/errors.js";
import { createDashboardEntryId } from "~/domain/dashboardEntryId.js";
import type { DashboardEntryValues } from "~/domain/types.js";
import type { DashboardLayout } from "~/domain/types.js";

class SaveMyDashboardRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: DashboardModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async save(
        ownerId: string,
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, RepositoryAbstraction.Error>> {
        try {
            const model = await this.modelProvider.get();
            const entryId = createDashboardEntryId(ownerId);
            const id = createIdentifier({ id: entryId, version: 1 });
            const values = DashboardLayoutMapper.toEntryValues(ownerId, layout);

            // The first save creates the entry; every later save updates it in place.
            const existing = await this.getEntryById.execute<DashboardEntryValues>(model, id);
            if (existing.isFail() && existing.error.code !== "Cms/Entry/NotFound") {
                return Result.fail(new DashboardPersistenceError(existing.error));
            }

            if (existing.isOk()) {
                const updated = await this.updateEntry.execute<DashboardEntryValues>(model, id, {
                    values
                });
                if (updated.isFail()) {
                    return Result.fail(new DashboardPersistenceError(updated.error));
                }
                const saved = DashboardLayoutMapper.toLayout(updated.value.values);
                return Result.ok(saved);
            }

            const created = await this.createEntry.execute<DashboardEntryValues>(model, {
                id: entryId,
                values
            });
            if (created.isFail()) {
                return Result.fail(new DashboardPersistenceError(created.error));
            }
            const saved = DashboardLayoutMapper.toLayout(created.value.values);
            return Result.ok(saved);
        } catch (error) {
            return Result.fail(new DashboardPersistenceError(error as Error));
        }
    }
}

export const SaveMyDashboardRepository = RepositoryAbstraction.createImplementation({
    implementation: SaveMyDashboardRepositoryImpl,
    dependencies: [
        DashboardModelProvider,
        GetEntryByIdUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
