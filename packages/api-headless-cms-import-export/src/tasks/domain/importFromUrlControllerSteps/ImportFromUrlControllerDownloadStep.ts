import type { ImportFromUrlControllerStep } from "./abstractions/ImportFromUrlControllerStep.js";
import type {
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload.js";
import { IMPORT_FROM_URL_DOWNLOAD_TASK } from "~/tasks/constants.js";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds.js";
import { CmsImportExportFileType, type Context } from "~/types.js";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { IImportFromUrlControllerInputStep } from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { getChildTasks } from "./getChildTasks.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export class ImportFromUrlControllerDownloadStep<
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<I, O> {
    constructor(private context: Context) {}

    public async execute(
        params: TaskDefinition.RunParams<I, O>
    ): Promise<TaskDefinition.Result<I, O>> {
        const { input, controller } = params;

        const task = controller.state.getTask();

        const step = input.steps[IImportFromUrlControllerInputStep.DOWNLOAD];
        if (!step?.triggered) {
            const files = input.files.filter(file => {
                return (
                    file.type === CmsImportExportFileType.ENTRIES ||
                    file.type === CmsImportExportFileType.ASSETS
                );
            });
            if (files.length === 0) {
                return controller.response.error({
                    message: `No files found in the provided data.`,
                    code: "NO_FILES_FOUND"
                });
            }
            for (const file of files) {
                await controller.task.trigger<IImportFromUrlDownloadInput>({
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

            return controller.response.continue(output, {
                seconds: getBackOffSeconds(task.iterations)
            });
        } else if (step.finished !== true) {
            const { failed, running, invalid, aborted, done, collection } = await getChildTasks<
                IImportFromUrlDownloadInput,
                IImportFromUrlDownloadOutput
            >({
                context: this.context,
                task,
                definition: IMPORT_FROM_URL_DOWNLOAD_TASK
            });

            /**
             * If there are any running tasks, we should continue waiting.
             */
            if (running.length > 0) {
                return controller.response.continue(input, {
                    seconds: getBackOffSeconds(task.iterations)
                });
            } else if (collection.length === 0) {
                return controller.response.error({
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
                return controller.response.error({
                    message: "Some download tasks failed.",
                    code: "DOWNLOAD_FAILED",
                    data: {
                        failed,
                        aborted,
                        invalid
                    }
                });
            }

            return controller.response.continue(output);
        }
        return controller.response.error({
            message: "Impossible to get to this point. Fatal error."
        });
    }
}
