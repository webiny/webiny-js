import { ICmsImportExportRecord } from "~/domain/abstractions/CmsImportExportRecord";
import { TaskDataStatus } from "@webiny/tasks";

export class CmsImportExportRecord implements ICmsImportExportRecord {
    public id: string;
    public createdOn: string;
    public createdBy: any;
    public finishedOn: string | null;
    public modelId: string;
    public files: string[] | null;
    public expiresOn: Date | null;
    public exportAssets: boolean;
    public status: TaskDataStatus;

    constructor(data: ICmsImportExportRecord) {
        this.id = data.id;
        this.createdOn = data.createdOn;
        this.createdBy = data.createdBy;
        this.finishedOn = data.finishedOn;
        this.modelId = data.modelId;
        this.files = data.files;
        this.expiresOn = data.expiresOn;
        this.exportAssets = data.exportAssets;
        this.status = data.status;
    }
}

export const createCmsImportExportRecord = (
    data: ICmsImportExportRecord
): ICmsImportExportRecord => {
    return new CmsImportExportRecord(data);
};
