import type { ICmsImportExportValidateRecord } from "~/domain/abstractions/CmsImportExportValidateRecord";
import type { ICmsImportExportValidatedFile } from "~/types";
import type { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import type { TaskDataStatus } from "@webiny/tasks";

export class CmsImportExportValidateRecord implements ICmsImportExportValidateRecord {
    public readonly id: string;
    public readonly files: NonEmptyArray<ICmsImportExportValidatedFile> | undefined;
    public readonly status: TaskDataStatus;
    public readonly error: GenericRecord | undefined;

    public constructor(params: ICmsImportExportValidateRecord) {
        this.id = params.id;
        this.files = params.files;
        this.status = params.status;
        this.error = params.error;
    }
}

export const createCmsImportValidateRecord = (
    data: ICmsImportExportValidateRecord
): ICmsImportExportValidateRecord => {
    return new CmsImportExportValidateRecord(data);
};
