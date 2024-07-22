import { createCmsImportValidateRecord } from "~/domain";
import { ITask } from "@webiny/tasks";
import {
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";

export const convertTaskToValidateImportFromUrlRecord = (
    task: ITask<IValidateImportFromUrlInput, IValidateImportFromUrlOutput>
) => {
    return createCmsImportValidateRecord({
        id: task.id,
        files: task.output?.files || task.input.files,
        status: task.taskStatus,
        error: task.output?.error
    });
};
