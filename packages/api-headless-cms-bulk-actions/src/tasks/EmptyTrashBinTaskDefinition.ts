import type { IEmptyTrashBinsInput, IEmptyTrashBinsOutput } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

const calculateDateTimeString = () => {
    // Retrieve the retention period from the environment variable WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS,
    // or default to 90 days if not set or set to 0.
    const retentionPeriodFromEnv = process.env["WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS"];
    const retentionPeriod =
        retentionPeriodFromEnv && Number(retentionPeriodFromEnv) !== 0
            ? Number(retentionPeriodFromEnv)
            : 90;

    // Calculate the date-time by subtracting the retention period (in days) from the current date.
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - retentionPeriod);

    // Return the calculated date-time string in ISO 8601 format.
    return currentDate.toISOString();
};

class EmptyTrashBinTask
    implements TaskDefinition.Interface<IEmptyTrashBinsInput, IEmptyTrashBinsOutput>
{
    public readonly isPrivate = true;
    public readonly id = "hcmsEntriesEmptyTrashBins";
    public readonly title = "Headless CMS - Empty all trash bins";
    public readonly description =
        "Delete all entries in the trash bin for each model in the system.";
    public readonly maxIterations = 120;
    public readonly enableDatabaseLogs = false;

    constructor(
        private tenantContext: TenantContext.Interface,
        private listTenants: ListTenantsUseCase.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async run(
        params: TaskDefinition.RunParams<IEmptyTrashBinsInput, IEmptyTrashBinsOutput>
    ): Promise<TaskDefinition.Result<IEmptyTrashBinsInput, IEmptyTrashBinsOutput>> {
        const { input, controller } = params;

        // Abort the task if needed.
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        // Fetch all tenants, excluding those already processed.
        const tenantsResult = await this.listTenants.execute();
        const baseTenants = tenantsResult.value;
        const executedTenantIds = input.executedTenantIds || [];
        const tenants = baseTenants.filter(tenant => !executedTenantIds.includes(tenant.id));

        let shouldTaskContinue = false;

        // Iterate over each tenant.
        await this.tenantContext.withEachTenant(tenants, async tenant => {
            if (controller.runtime.isCloseToTimeout()) {
                shouldTaskContinue = true;
                return;
            }

            if (controller.runtime.isCloseToTimeout()) {
                shouldTaskContinue = true;
                return;
            }

            // List all non-private models.
            const modelsResult = await this.listModels.execute({ includePrivate: false });
            const models = modelsResult.value;

            // Process each model to delete trashed entries.
            for (const model of models) {
                // Query parameters for fetching deleted entries older than a minute ago.
                const listEntriesParams = {
                    where: {
                        deletedOn_lt: calculateDateTimeString()
                    },
                    limit: 50
                };

                // Continue deleting entries while there are entries left to delete.
                while (true) {
                    const listResult = await this.listDeletedEntries.execute(
                        model,
                        listEntriesParams
                    );
                    const { entries, meta } = listResult.value;

                    if (meta.totalCount === 0) {
                        break;
                    }

                    if (controller.runtime.isCloseToTimeout()) {
                        shouldTaskContinue = true;
                        break;
                    }
                    for (const entry of entries) {
                        if (controller.runtime.isCloseToTimeout()) {
                            shouldTaskContinue = true;
                            break;
                        }
                        // Delete each entry individually.
                        await this.deleteEntry.execute(model, entry.id, { permanently: true });
                    }
                }
            }

            // If the task isn't continuing, add the tenant to the executed list.
            if (!shouldTaskContinue) {
                executedTenantIds.push(tenant.id);
            }
        });

        // Continue the task or mark it as done based on the `shouldContinue` flag.
        return shouldTaskContinue
            ? controller.response.continue({ ...input, executedTenantIds })
            : controller.response.done(
                  "Task done: emptied the trash bin for all registered models."
              );
    }
}

export const EmptyTrashBinTaskDefinition = TaskDefinition.createImplementation({
    implementation: EmptyTrashBinTask,
    dependencies: [
        TenantContext,
        ListTenantsUseCase,
        ListModelsUseCase,
        ListDeletedEntriesUseCase,
        DeleteEntryUseCase
    ]
});
