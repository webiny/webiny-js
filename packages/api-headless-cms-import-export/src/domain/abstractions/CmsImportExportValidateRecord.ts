import { ICmsImportExportValidatedFile } from "~/types";
import { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface ICmsImportExportValidateRecord {
    id: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile> | undefined;
    status: TaskDataStatus;
    error?: GenericRecord;
}
