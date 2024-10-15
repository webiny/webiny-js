import { createTaskDefinition, TaskDataStatus } from "@webiny/tasks";
import { HcmsBulkActionsContext, IBulkActionOperationByModelInput } from "~/types";
import { ChildTasksCleanup } from "~/useCases/internals";

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
// TODO fix
const cleanup = async ({ context, task }: any) => {
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
};

export const createEmptyTrashBinsTask = () => {
    return createTaskDefinition<HcmsBulkActionsContext>({
        // TODO put to true when done with testing
        isPrivate: false,
        id: "hcmsEntriesEmptyTrashBins",
        title: "Headless CMS - Empty all trash bins",
        description:
            "Delete all entries found in the trash bin, for each model found in the system.",
        maxIterations: 24,
        disableDatabaseLogs: true,
        run: async params => {
            const { response, isAborted, isCloseToTimeout, context, trigger, input, store } =
                params;
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: 30
                    }
                );
            }

            if (input.triggered) {
                const { items } = await context.tasks.listTasks({
                    where: {
                        parentId: store.getTask().id
                    },
                    limit: 100000
                });
                for (const item of items) {
                    if (
                        item.taskStatus === TaskDataStatus.RUNNING ||
                        item.taskStatus === TaskDataStatus.PENDING
                    ) {
                        const status = await context.tasks.fetchServiceInfo(item.id);
                        if (status?.status === "FAILED" || status?.status === "TIMED_OUT") {
                            await context.tasks.updateTask(item.id, {
                                taskStatus: TaskDataStatus.FAILED
                            });
                            continue;
                        } else if (status?.status === "ABORTED") {
                            await context.tasks.updateTask(item.id, {
                                taskStatus: TaskDataStatus.ABORTED
                            });
                            continue;
                        }
                        return response.continue(
                            {
                                ...input
                            },
                            {
                                seconds: 3600
                            }
                        );
                    }
                }

                return response.done();
            }

            try {
                const locales = context.i18n.getLocales();

                await context.i18n.withEachLocale(locales, async () => {
                    const models = await context.security.withoutAuthorization(async () => {
                        return (await context.cms.listModels()).filter(model => !model.isPrivate);
                    });

                    for (const model of models) {
                        await trigger<IBulkActionOperationByModelInput>({
                            name: `Headless CMS - Empty trash bin for "${model.name}" model.`,
                            definition: "hcmsBulkListDeleteEntries",
                            input: {
                                modelId: model.modelId,
                                where: {
                                    deletedOn_lt: calculateDateTimeString()
                                }
                            }
                        });
                    }
                });

                return response.continue(
                    {
                        triggered: true
                    },
                    {
                        seconds: 60
                    }
                );
            } catch (ex) {
                return response.error(ex.message ?? "Error while executing EmptyTrashBins task");
            }
        },
        onMaxIterations: cleanup,
        onDone: cleanup,
        onError: cleanup,
        onAbort: cleanup
    });
};
