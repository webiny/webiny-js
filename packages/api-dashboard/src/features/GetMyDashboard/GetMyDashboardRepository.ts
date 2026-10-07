import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { createIdentifier } from "@webiny/utils";
import { GetMyDashboardRepository as RepositoryAbstraction } from "./abstractions.js";
import { DashboardModelProvider } from "~/domain/abstractions.js";
import { DashboardLayoutMapper } from "~/domain/DashboardLayoutMapper.js";
import { DashboardPersistenceError } from "~/domain/errors.js";
import { createDashboardEntryId } from "~/domain/dashboardEntryId.js";
import type { DashboardEntryValues } from "~/domain/types.js";
import type { DashboardLayout } from "~/domain/types.js";

class GetMyDashboardRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: DashboardModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface
    ) {}

    async get(
        ownerId: string
    ): Promise<Result<DashboardLayout | null, RepositoryAbstraction.Error>> {
        try {
            const model = await this.modelProvider.get();
            const entryId = createDashboardEntryId(ownerId);
            const id = createIdentifier({ id: entryId, version: 1 });

            const result = await this.getEntryById.execute<DashboardEntryValues>(model, id);
            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/NotFound") {
                    return Result.ok(null);
                }
                return Result.fail(new DashboardPersistenceError(result.error));
            }

            const layout = DashboardLayoutMapper.toLayout(result.value.values);
            return Result.ok(layout);
        } catch (error) {
            return Result.fail(new DashboardPersistenceError(error as Error));
        }
    }
}

export const GetMyDashboardRepository = RepositoryAbstraction.createImplementation({
    implementation: GetMyDashboardRepositoryImpl,
    dependencies: [DashboardModelProvider, GetEntryByIdUseCase]
});
