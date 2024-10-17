import type { ImportFromUrlControllerStep } from "./abstractions/ImportFromUrlControllerStep";
import { IMPORT_FROM_URL_PROCESS_ENTRIES_TASK } from "~/tasks/constants";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import type { Context } from "~/types";
import { CmsImportExportFileType } from "~/types";
import type {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";
import { IImportFromUrlControllerInputStep } from "~/tasks/domain/abstractions/ImportFromUrlController";
import type { ITask, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { getChildTasks } from "./getChildTasks";
import type { IImportFromUrlProcessEntriesInput } from "../importFromUrlProcessEntries/abstractions/ImportFromUrlProcessEntries";
import { prependImportPath } from "~/tasks/utils/helpers/importPath";

export class ImportFromUrlControllerProcessEntriesStep<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> implements ImportFromUrlControllerStep<C, I, O>
{
    public async execute(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, trigger, store } = params;

        const task = store.getTask() as ITask<I, O>;

        const step = input.steps[IImportFromUrlControllerInputStep.PROCESS_ENTRIES];
        if (!step?.triggered) {
            const files = input.files.filter(file => {
                return file.type === CmsImportExportFileType.ENTRIES;
            });
            if (files.length === 0) {
                const output: IImportFromUrlControllerOutput = {
                    error: {
                        message: "No entries files found.",
                        code: "NO_ENTRIES_FILES"
                    },
                    files: [],
                    aborted: [],
                    done: [],
                    failed: [],
                    invalid: []
                };
                return response.done(output as O);
            }
            const inputFiles: string[] = [];
            for (const file of files) {
                const key = prependImportPath(file.key);
                await trigger<IImportFromUrlProcessEntriesInput>({
                    name: `Import From Url - Process entries`,
                    definition: IMPORT_FROM_URL_PROCESS_ENTRIES_TASK,
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
                    [IImportFromUrlControllerInputStep.PROCESS_ENTRIES]: {
                        ...step,
                        triggered: true,
                        files: inputFiles
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
                definition: IMPORT_FROM_URL_PROCESS_ENTRIES_TASK
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
                    message: "No process entries tasks found. We are not continuing.",
                    code: "NO_PROCESS_ENTRIES_TASKS"
                });
            }

            const output: I = {
                ...input,
                steps: {
                    ...input.steps,
                    [IImportFromUrlControllerInputStep.PROCESS_ENTRIES]: {
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
