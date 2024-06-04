import { CmsIdentity } from "@webiny/api-headless-cms/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface ICmsImportExportRecord {
    id: string;
    createdOn: string;
    createdBy: CmsIdentity;
    finishedOn?: string;
    modelId: string;
    file?: string;
    url?: string;
    status: TaskDataStatus;
}
