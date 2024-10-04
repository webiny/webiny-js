import type { ImportFromUrlControllerStep } from "./abstractions/ImportFromUrlControllerStep";
import type {
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload";
import { IMPORT_FROM_URL_DOWNLOAD_TASK } from "~/tasks/constants";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import { CmsImportExportFileType, Context } from "~/types";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { IImportFromUrlControllerInputStep } from "~/tasks/domain/abstractions/ImportFromUrlController";
import type { ITask, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { getChildTasks } from "./getChildTasks";

export class ImportFromUrlControllerDownloadStep<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<C, I, O>
{
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, trigger, store } = params;

        const task = store.getTask() as ITask<I, O>;

        const step = input.steps[IImportFromUrlControllerInputStep.DOWNLOAD];
        if (!step?.triggered) {
            const files = input.files.filter(file => {
                return (
                    file.type === CmsImportExportFileType.ENTRIES ||
                    file.type === CmsImportExportFileType.ASSETS
                );
            });
            if (files.length === 0) {
                return response.error({
                    message: `No files found in the provided data.`,
                    code: "NO_FILES_FOUND"
                });
            }
            for (const file of files) {
                await trigger<IImportFromUrlDownloadInput>({
                    name: `Import From Url - Download`,
                    definition: IMPORT_FROM_URL_DOWNLOAD_TASK,
                    input: {
                        file,
                        modelId: input.modelId
                    }
                });
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.DOWNLOAD]: {
                        ...step,
                        triggered: true
                    }
                }
            };

            return response.continue(output, {
                seconds: getBackOffSeconds(task.iterations)
            });
        } else if (step.finished !== true) {
            const { failed, running, invalid, aborted, done, collection } = await getChildTasks<
                IImportFromUrlDownloadInput,
                IImportFromUrlDownloadOutput
            >({
                context,
                task,
                definition: IMPORT_FROM_URL_DOWNLOAD_TASK
            });

            /**
             * If there are any running tasks, we should continue waiting.
             */
            if (running.length > 0) {
                return response.continue(input, {
                    seconds: getBackOffSeconds(task.iterations)
                });
            } else if (collection.length === 0) {
                return response.error({
                    message: "No download tasks found. We are not continuing.",
                    code: "NO_DOWNLOAD_TASKS"
                });
            }

            const files = collection
                .map(item => {
                    return item.output?.file;
                })
                .filter((file): file is string => {
                    return !!file;
                });

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.DOWNLOAD]: {
                        ...step,
                        files,
                        failed,
                        invalid,
                        aborted,
                        done,
                        finished: true
                    }
                }
            };

            if (failed.length > 0 || aborted.length > 0 || invalid.length > 0) {
                return response.error({
                    message: "Some download tasks failed.",
                    code: "DOWNLOAD_FAILED",
                    data: {
                        failed,
                        aborted,
                        invalid
                    }
                });
            }

            return response.continue(output);
        }
        return response.error({
            message: "Impossible to get to this point. Fatal error."
        });
    }
}
