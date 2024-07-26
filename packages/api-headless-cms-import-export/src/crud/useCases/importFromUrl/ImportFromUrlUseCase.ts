import {
    IImportFromUrlUseCase,
    IImportFromUrlUseCaseExecuteParams,
    IImportFromUrlUseCaseExecuteResponse
} from "./abstractions/ImportFromUrlUseCase";
import { ITasksContextObject, TaskDataStatus } from "@webiny/tasks";
import {
    IMPORT_FROM_URL_CONTROLLER_TASK,
    VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK
} from "~/tasks/constants";
import { WebinyError } from "@webiny/error";
import {
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import { convertTaskToImportRecord } from "~/crud/utils/convertTaskToImportRecord";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";

export interface IImportFromUrlUseCaseParams {
    updateTask: ITasksContextObject["updateTask"];
    getTask: ITasksContextObject["getTask"];
    triggerTask: ITasksContextObject["trigger"];
}

export class ImportFromUrlUseCase implements IImportFromUrlUseCase {
    private readonly updateTask: ITasksContextObject["updateTask"];
    private readonly getTask: ITasksContextObject["getTask"];
    private readonly triggerTask: ITasksContextObject["trigger"];

    public constructor(params: IImportFromUrlUseCaseParams) {
        this.updateTask = params.updateTask;
        this.getTask = params.getTask;
        this.triggerTask = params.triggerTask;
    }

    public async execute(
        params: IImportFromUrlUseCaseExecuteParams
    ): Promise<IImportFromUrlUseCaseExecuteResponse | null> {
        /**
         * First we need to check if the integrity task exists and that it ran successfully.
         */
        const integrityTask = await this.getTask<
            IValidateImportFromUrlInput,
            IValidateImportFromUrlOutput
        >(params.id);
        if (integrityTask?.definitionId !== VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK) {
            return null;
        } else if (integrityTask.taskStatus !== TaskDataStatus.SUCCESS) {
            throw new WebinyError({
                message: "Integrity check failed.",
                code: "INTEGRITY_CHECK_FAILED",
                data: {
                    status: integrityTask.taskStatus,
                    files: integrityTask.output?.files,
                    error: integrityTask.output?.error
                }
            });
        } else if (!integrityTask.output?.files?.length) {
            throw new WebinyError({
                message: "No files found in the provided data.",
                code: "NO_FILES_FOUND"
            });
        } else if (integrityTask.output?.importTaskId) {
            throw new WebinyError({
                message: "Import was already started. You cannot start it again.",
                code: "IMPORT_TASK_EXISTS",
                data: {
                    id: integrityTask.output.importTaskId
                }
            });
        }
        /**
         * Now we need to check if the actual import task already exists.
         * We don't want to run the import task multiple times.
         */
        const importTask = await this.triggerTask<
            IImportFromUrlControllerInput,
            IImportFromUrlControllerOutput
        >({
            name: `Import from URL`,
            definition: IMPORT_FROM_URL_CONTROLLER_TASK,
            input: {
                modelId: integrityTask.output.modelId,
                files: integrityTask.output.files,
                importing: false
            },
            parent: integrityTask
        });

        await this.updateTask(integrityTask.id, {
            output: {
                ...integrityTask.output,
                importTaskId: importTask.id
            }
        });
        return convertTaskToImportRecord(importTask);
    }
}
