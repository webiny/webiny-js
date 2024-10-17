import type { ICmsImportExportValidatedFile } from "~/types";
import type { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import type { TaskDataStatus } from "@webiny/tasks";

export interface ICmsImportExportValidateRecord {
    id: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile> | undefined;
    status: TaskDataStatus;
    error?: GenericRecord;
}
