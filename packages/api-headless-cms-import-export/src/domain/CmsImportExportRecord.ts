import { ICmsImportExportRecord } from "~/domain/abstractions/CmsImportExportRecord";

export class CmsImportExportRecord implements ICmsImportExportRecord {
    public id: string;
    public createdOn: string;
    public createdBy: any;
    public finishedOn?: string;
    public modelId: string;
    public file?: string;
    public url?: string;
    public status: any;

    constructor(data: ICmsImportExportRecord) {
        this.id = data.id;
        this.createdOn = data.createdOn;
        this.createdBy = data.createdBy;
        this.finishedOn = data.finishedOn;
        this.modelId = data.modelId;
        this.file = data.file;
        this.url = data.url;
        this.status = data.status;
    }
}

export const createCmsImportExportRecord = (
    data: ICmsImportExportRecord
): ICmsImportExportRecord => {
    return new CmsImportExportRecord(data);
};
