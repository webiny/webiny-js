import { ITaskResponseResult, ITaskRunParams, TaskDataStatus } from "@webiny/tasks";
import {
    IImportFromUrlController,
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { CmsImportExportFileType, Context } from "~/types";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import {
    IMPORT_FROM_URL_ASSETS_TASK,
    IMPORT_FROM_URL_CONTENT_ENTRIES_TASK
} from "~/tasks/constants";

export class ImportFromUrlController<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements IImportFromUrlController<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, store, trigger } = params;

        const task = store.getTask();

        if (!input.modelId) {
            return response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (Array.isArray(input.files) === false || input.files.length === 0) {
            return response.error({
                message: `No files found in the provided data.`,
                code: "NO_FILES_FOUND"
            });
        }

        try {
            await context.cms.getModel(input.modelId);
        } catch (ex) {
            return response.error({
                message: `Model "${input.modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        if (!input.importing) {
            for (const file of input.files) {
                if (file.type === CmsImportExportFileType.COMBINED_ENTRIES) {
                    await trigger({
                        name: `Import Content Entries from URL for "${input.modelId}"`,
                        definition: IMPORT_FROM_URL_CONTENT_ENTRIES_TASK,
                        input: {
                            file
                        }
                    });
                    continue;
                } else if (file.type === CmsImportExportFileType.ASSETS) {
                    await trigger({
                        name: `Import assets from URL for "${input.modelId}"`,
                        definition: IMPORT_FROM_URL_ASSETS_TASK,
                        input: {
                            file
                        }
                    });
                    continue;
                }
                console.warn(`Cannot import a file of type: ${file.type}`);
            }

            return response.continue(
                {
                    ...input,
                    importing: true
                },
                {
                    seconds: getBackOffSeconds(task.iterations)
                }
            );
        }

        const running: string[] = [];
        const done: string[] = [];
        const invalid: string[] = [];
        const aborted: string[] = [];
        const failed: string[] = [];

        const { items: tasks } = await context.tasks.listTasks({
            where: {
                parentId: task.id
            }
        });
        for (const task of tasks) {
            if (
                task.taskStatus === TaskDataStatus.RUNNING ||
                task.taskStatus === TaskDataStatus.PENDING
            ) {
                running.push(task.id);
                continue;
            } else if (task.taskStatus === TaskDataStatus.SUCCESS) {
                done.push(task.id);
                continue;
            } else if (task.taskStatus === TaskDataStatus.FAILED) {
                failed.push(task.id);
                continue;
            } else if (task.taskStatus === TaskDataStatus.ABORTED) {
                aborted.push(task.id);
                continue;
            }
            /**
             * Impossible to be in a state not listed above, but just in case.
             */
            invalid.push(task.id);
        }
        /**
         * If there are any running tasks, we should continue waiting.
         */
        if (running.length > 0) {
            return response.continue(
                {
                    ...input,
                    importing: true
                },
                {
                    seconds: getBackOffSeconds(task.iterations)
                }
            );
        }
        return response.done({
            done,
            invalid,
            aborted,
            failed
        } as O);
    }
}
