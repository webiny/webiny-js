import { BinIdentity } from "~/types";

export interface BinEntryDTO {
    id: string;
    title: string;
    createdBy: BinIdentity;
    deletedBy: BinIdentity;
    deletedOn: string;
    [key: string]: any;
}

export class BinEntry {
    public id: string;
    public title: string;
    public createdBy: BinIdentity;
    public deletedOn: string;
    public deletedBy: BinIdentity;

    protected constructor(entry: BinEntryDTO) {
        this.id = entry.id;
        this.title = entry.title;
        this.createdBy = entry.createdBy;
        this.deletedOn = entry.deletedOn;
        this.deletedBy = entry.deletedBy;
    }

    static create(entry: BinEntryDTO) {
        return new BinEntry(entry);
    }
}
