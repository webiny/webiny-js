import { createCmsImportValidateRecord } from "~/domain";
import { ITask } from "@webiny/tasks";
import {
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import { NonEmptyArray } from "@webiny/api/types";
import { ICmsImportExportValidatedFile } from "~/types";

export const convertTaskToValidateImportFromUrlRecord = (
    task: ITask<IValidateImportFromUrlInput, IValidateImportFromUrlOutput>
) => {
    const files = task.input.files.map(file => {
        const output = task.output?.files?.find(f => f.checksum === file.checksum);
        if (output) {
            return {
                ...output,
                error: output.error,
                type: output.type,
                size: output.size
            };
        }
        return file;
    });

    return createCmsImportValidateRecord({
        id: task.id,
        files: files as unknown as NonEmptyArray<ICmsImportExportValidatedFile>,
        status: task.taskStatus,
        error: task.output?.error
    });
};
