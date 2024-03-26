import { TrashBinIdentity } from "~/types";

export interface TrashBinItemDTO {
    id: string;
    title: string;
    createdBy: TrashBinIdentity;
    deletedBy: TrashBinIdentity;
    deletedOn: string;
    [key: string]: any;
}

export class TrashBinItem {
    public id: string;
    public title: string;
    public createdBy: TrashBinIdentity;
    public deletedOn: string;
    public deletedBy: TrashBinIdentity;

    protected constructor(entry: TrashBinItemDTO) {
        this.id = entry.id;
        this.title = entry.title;
        this.createdBy = entry.createdBy;
        this.deletedOn = entry.deletedOn;
        this.deletedBy = entry.deletedBy;
    }

    static create(entry: TrashBinItemDTO) {
        return new TrashBinItem(entry);
    }
}
