import { CmsIdentity } from "@webiny/api-headless-cms/types";
import { TaskDataStatus } from "@webiny/tasks";

export interface ICmsImportExportRecord {
    id: string;
    createdOn: string;
    createdBy: CmsIdentity;
    finishedOn: string | null;
    modelId: string;
    file: string | null;
    url: string | null;
    expiresOn: Date | null;
    status: TaskDataStatus;
}
