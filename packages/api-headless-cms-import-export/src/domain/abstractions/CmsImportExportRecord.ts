import { CmsIdentity } from "@webiny/api-headless-cms/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface ICmsImportExportRecordFile {
    url: string;
    expiresOn: string;
    type: "entries" | "assets";
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
