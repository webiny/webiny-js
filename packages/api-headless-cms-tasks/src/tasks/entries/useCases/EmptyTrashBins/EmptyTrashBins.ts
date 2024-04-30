import { ITaskResponseResult } from "@webiny/tasks";
import { EntriesTask, IBulkActionOperationByModelInput, IEmptyTrashBins } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class EmptyTrashBins implements IUseCase<IEmptyTrashBins, ITaskResponseResult> {
    public async execute(params: IEmptyTrashBins) {
        const { response, isAborted, context } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            }

            const locales = context.i18n.getLocales();

            await context.i18n.withEachLocale(locales, async () => {
                const models = await context.security.withoutAuthorization(async () => {
                    return (await context.cms.listModels()).filter(model => !model.isPrivate);
                });

                const identity = context.security.getIdentity();

                for (const model of models) {
                    await context.tasks.trigger<IBulkActionOperationByModelInput>({
                        name: `Headless CMS - Empty trash bin for "${model.name}" model.`,
                        definition: EntriesTask.DeleteEntriesByModel,
                        parent: params.store.getTask(),
                        input: {
                            modelId: model.modelId,
                            identity,
                            where: {
                                deletedOn_lt: this.calculateDateTimeString()
                            }
                        }
                    });
                }
                return;
            });

            return response.done(`Task done: emptying the trash bin for all registered models.`);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing EmptyTrashBins");
        }
    }

    private calculateDateTimeString() {
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
    }
}
