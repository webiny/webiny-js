import { CmsImportExportFileType, Context } from "~/types";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerInputStep,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { ImportFromUrlControllerStep } from "~/tasks/domain/importFromUrlControllerSteps/abstractions/ImportFromUrlControllerStep";
import { ITask, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { prependImportPath } from "~/tasks/utils/helpers/importPath";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import { IMPORT_FROM_URL_PROCESS_ASSETS_TASK } from "~/tasks/constants";
import { getChildTasks } from "~/tasks/domain/importFromUrlControllerSteps/getChildTasks";
import { IImportFromUrlProcessAssetsInput } from "../importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets";

export class ImportFromUrlControllerProcessAssetsStep<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<C, I, O>
{
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response, input, trigger, store, context } = params;

        const task = store.getTask() as ITask<I, O>;

        const step = input.steps?.[IImportFromUrlControllerInputStep.PROCESS_ASSETS] || {};
        if (!step.triggered) {
            const files = input.files.filter(file => {
                return file.type === CmsImportExportFileType.ASSETS;
            });
            if (files.length === 0) {
                const output: IImportFromUrlControllerOutput = {
                    error: {
                        message: "No assets files found.",
                        code: "NO_ASSETS_FILES"
                    },
                    aborted: [],
                    done: [],
                    failed: [],
                    invalid: []
                };
                return response.done(output as O);
            }
            for (const file of files) {
                await trigger<IImportFromUrlProcessAssetsInput>({
                    name: `Import From Url - Process assets`,
                    definition: IMPORT_FROM_URL_PROCESS_ASSETS_TASK,
                    input: {
                        file: {
                            key: prependImportPath(file.key),
                            type: file.type
                        },
                        maxInsertErrors: input.maxInsertErrors,
                        modelId: input.modelId
                    }
                });
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.PROCESS_ASSETS]: {
                        triggered: true
                    }
                }
            };

            return response.continue(output, {
                seconds: getBackOffSeconds(task.iterations)
            });
        } else if (step.finished !== true) {
            const { failed, running, invalid, aborted, collection, done } = await getChildTasks({
                context,
                task,
                definition: IMPORT_FROM_URL_PROCESS_ASSETS_TASK
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
            return response.continue(output);
        }
        return response.error({
            message: "Impossible to get to this point. Fatal error."
        });
    }
}
