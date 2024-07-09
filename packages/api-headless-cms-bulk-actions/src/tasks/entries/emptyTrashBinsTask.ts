import { createTaskDefinition } from "@webiny/tasks";
import { ChildTasksCleanup } from "~/tasks/common";
import { EntriesTask, HcmsBulkActionsContext, IBulkActionOperationByModelInput } from "~/types";

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

export const createEmptyTrashBinsTask = () => {
    return createTaskDefinition<HcmsBulkActionsContext>({
        id: EntriesTask.EmptyTrashBins,
        title: "Headless CMS - Empty all trash bins",
        description:
            "Delete all entries found in the trash bin, for each model found in the system.",
        maxIterations: 1,
        run: async params => {
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

                    for (const model of models) {
                        await context.tasks.trigger<IBulkActionOperationByModelInput>({
                            name: `Headless CMS - Empty trash bin for "${model.name}" model.`,
                            definition: EntriesTask.DeleteEntriesByModel,
                            parent: params.store.getTask(),
                            input: {
                                modelId: model.modelId,
                                where: {
                                    deletedOn_lt: calculateDateTimeString()
                                }
                            }
                        });
                    }
                    return;
                });

                return response.done(
                    `Task done: emptying the trash bin for all registered models.`
                );
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing EmptyTrashBins task");
            }
        },
        onDone: async ({ context, task }) => {
            /**
             * We want to clean all child tasks and logs, which have no errors.
             */
            const childTasksCleanup = new ChildTasksCleanup();
            try {
                await childTasksCleanup.execute({
                    context,
                    task
                });
            } catch (ex) {
                console.error("Error while cleaning `EmptyTrashBins` child tasks.", ex);
            }
        }
    });
};
