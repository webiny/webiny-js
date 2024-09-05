import { ImportFromUrlControllerStep } from "./abstractions/ImportFromUrlControllerStep";
import { IImportFromUrlDecompressInput } from "~/tasks/domain/abstractions/ImportFromUrlDecompress";
import { IMPORT_FROM_URL_DECOMPRESS_TASK } from "~/tasks/constants";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import { Context } from "~/types";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerInputStep,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { ITask, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { getChildTasks } from "./getChildTasks";

export class ImportFromUrlControllerDecompressStep<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<C, I, O>
{
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, trigger, store } = params;

        const task = store.getTask() as ITask<I, O>;

        const step = input.steps?.[IImportFromUrlControllerInputStep.DECOMPRESS] || {};
        if (!step.triggered) {
            for (const file of input.files) {
                await trigger<IImportFromUrlDecompressInput>({
                    name: `Import From Url - Decompress`,
                    definition: IMPORT_FROM_URL_DECOMPRESS_TASK,
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
                    [IImportFromUrlControllerInputStep.DECOMPRESS]: {
                        triggered: true
                    }
                }
            };

            return response.continue(output, {
                seconds: getBackOffSeconds(task.iterations)
            });
        } else if (!step.done) {
            const { failed, running, invalid, aborted, collection } = await getChildTasks({
                context,
                task,
                definition: IMPORT_FROM_URL_DECOMPRESS_TASK
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
                    message: "No decompress tasks found. We are not continuing.",
                    code: "NO_DECOMPRESS_TASKS"
                });
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.DECOMPRESS]: {
                        ...step,
                        failed,
                        invalid,
                        aborted,
                        done: true
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
