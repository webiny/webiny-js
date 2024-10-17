import type { CmsIdentity } from "@webiny/api-headless-cms/types";
import type { TaskDataStatus } from "@webiny/tasks";
import type { CmsImportExportFileType } from "~/types";

export interface ICmsImportExportRecordFile {
    key: string;
    checksum: string;
    type: CmsImportExportFileType;
}

export interface ICmsImportExportRecord {
    id: string;
    createdOn: string;
    createdBy: CmsIdentity;
    finishedOn: string | null;
    modelId: string;
    files: ICmsImportExportRecordFile[] | null;
    exportAssets: boolean;
    status: TaskDataStatus;
}
