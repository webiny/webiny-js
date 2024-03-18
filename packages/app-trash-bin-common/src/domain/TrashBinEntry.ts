import { TrashBinIdentity } from "~/types";

export interface TrashBinEntryDTO {
    id: string;
    title: string;
    createdBy: TrashBinIdentity;
    deletedBy: TrashBinIdentity;
    deletedOn: string;
    [key: string]: any;
}

export class TrashBinEntry {
    public id: string;
    public title: string;
    public createdBy: TrashBinIdentity;
    public deletedOn: string;
    public deletedBy: TrashBinIdentity;

    protected constructor(entry: TrashBinEntryDTO) {
        this.id = entry.id;
        this.title = entry.title;
        this.createdBy = entry.createdBy;
        this.deletedOn = entry.deletedOn;
        this.deletedBy = entry.deletedBy;
    }

    static create(entry: TrashBinEntryDTO) {
        return new TrashBinEntry(entry);
    }
}
