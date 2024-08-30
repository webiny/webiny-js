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
    return createCmsImportValidateRecord({
        id: task.id,
        files: (task.output?.files ||
            task.output?.error?.data?.files ||
            task.input.files) as NonEmptyArray<ICmsImportExportValidatedFile>,
        status: task.taskStatus,
        error: task.output?.error
    });
};
