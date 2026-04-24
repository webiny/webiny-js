import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsImportExportFileType, type Context } from "~/types.js";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import { IImportFromUrlControllerInputStep } from "~/tasks/domain/abstractions/ImportFromUrlController.js";
import type { ImportFromUrlControllerStep } from "~/tasks/domain/importFromUrlControllerSteps/abstractions/ImportFromUrlControllerStep.js";
import { prependImportPath } from "~/tasks/utils/helpers/importPath.js";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds.js";
import { IMPORT_FROM_URL_PROCESS_ASSETS_TASK } from "~/tasks/constants.js";
import { getChildTasks } from "~/tasks/domain/importFromUrlControllerSteps/getChildTasks.js";
import type { IImportFromUrlProcessAssetsInput } from "~/features/ImportFromUrlProcessAssetsTask/importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets.js";

export class ImportFromUrlControllerProcessAssetsStep<
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<I, O> {
    constructor(private context: Context) {}

    public async execute(
        params: TaskDefinition.RunParams<I, O>
    ): Promise<TaskDefinition.Result<I, O>> {
        const { input, controller } = params;

        const task = controller.state.getTask();

        const step = input.steps[IImportFromUrlControllerInputStep.PROCESS_ASSETS];
        if (!step?.triggered) {
            const files = input.files.filter(file => {
                return file.type === CmsImportExportFileType.ASSETS;
            });
            if (files.length === 0) {
                const output: IImportFromUrlControllerOutput = {
                    error: {
                        message: "No assets files found.",
                        code: "NO_ASSETS_FILES"
                    },
                    files: [],
                    aborted: [],
                    done: [],
                    failed: [],
                    invalid: []
                };
                return controller.response.done(output as O);
            }
            const inputFiles: string[] = [];
            for (const file of files) {
                const key = prependImportPath(file.key);
                await controller.task.trigger<IImportFromUrlProcessAssetsInput>({
                    name: `Import From Url - Process assets`,
                    definition: IMPORT_FROM_URL_PROCESS_ASSETS_TASK,
                    input: {
                        file: {
                            key,
                            type: file.type
                        },
                        maxInsertErrors: input.maxInsertErrors,
                        modelId: input.modelId
                    }
                });
                inputFiles.push(key);
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.PROCESS_ASSETS]: {
                        ...step,
                        triggered: true,
                        files: inputFiles
                    }
                }
            };

            return controller.response.continue(output, {
                seconds: getBackOffSeconds(task.iterations)
            });
        } else if (step.finished !== true) {
            const { failed, running, invalid, aborted, collection, done } = await getChildTasks({
                context: this.context,
                task,
                definition: IMPORT_FROM_URL_PROCESS_ASSETS_TASK
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
                    message: "No process assets tasks found. We are not continuing.",
                    code: "NO_PROCESS_ASSETS_TASKS"
                });
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.PROCESS_ASSETS]: {
                        ...step,
                        failed,
                        invalid,
                        aborted,
                        done,
                        finished: true
                    }
                }
            };
            return controller.response.continue(output);
        }
        return controller.response.error({
            message: "Impossible to get to this point. Fatal error."
        });
    }
}
