import { ITaskResponseResult } from "@webiny/tasks";
import { EntriesTask, IEmptyTrashBinByModelInput, IEmptyTrashBins } from "~/types";

export class EmptyTrashBins {
    public async execute(params: IEmptyTrashBins): Promise<ITaskResponseResult> {
        const { response, isAborted, context } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            }

            const models = await context.security.withoutAuthorization(async () => {
                return (await context.cms.listModels()).filter(model => !model.isPrivate);
            });

            if (models.length === 0) {
                return response.done("Task done: no public models found in the system.");
            }

            for (const model of models) {
                await context.tasks.trigger<IEmptyTrashBinByModelInput>({
                    name: `Headless CMS - Empty trash bin for "${model.name}" model.`,
                    definition: EntriesTask.EmptyTrashBinByModel,
                    parent: params.store.getTask(),
                    input: {
                        modelId: model.modelId,
                        where: {
                            deletedOn_lt: this.calculateDateTimeString()
                        }
                    }
                });
            }

            return response.done(`Task done: emptying the trash bin for ${models.length} models.`);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing EmptyTrashBins");
        }
    }

    private calculateDateTimeString() {
        const retentionPeriodFromEnv = process.env["WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS"];
        const retentionPeriod =
            retentionPeriodFromEnv && Number(retentionPeriodFromEnv) !== 0
                ? Number(retentionPeriodFromEnv)
                : 90;

        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - retentionPeriod);
        return currentDate.toISOString();
    }
}
