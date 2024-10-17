import type {
    IValidateImportFromUrlIntegrityUseCase,
    IValidateImportFromUrlIntegrityUseCaseExecuteParams,
    IValidateImportFromUrlIntegrityUseCaseExecuteResult
} from "./abstractions/ValidateImportFromUrlIntegrityUseCase";
import type { ITasksContextObject } from "@webiny/tasks";
import { VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK } from "~/tasks/constants";
import type { IValidateImportFromUrlInput } from "~/tasks/domain/abstractions/ValidateImportFromUrl";

export interface IValidateImportFromUrlIntegrityUseCaseParams {
    triggerTask: ITasksContextObject["trigger"];
}

export class ValidateImportFromUrlIntegrityUseCase
    implements IValidateImportFromUrlIntegrityUseCase
{
    private readonly triggerTask: ITasksContextObject["trigger"];

    public constructor(params: IValidateImportFromUrlIntegrityUseCaseParams) {
        this.triggerTask = params.triggerTask;
    }

    public async execute(
        params: IValidateImportFromUrlIntegrityUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlIntegrityUseCaseExecuteResult> {
        const { files, model } = params;

        const task = await this.triggerTask<IValidateImportFromUrlInput>({
            name: `Validate Import from URL Integrity`,
            definition: VALIDATE_IMPORT_FROM_URL_INTEGRITY_TASK,
            input: {
                model,
                files
            }
        });

        return {
            id: task.id,
            status: task.taskStatus
        };
    }
}
