import { TrashBinIdentity, TrashBinLocation } from "~/types";

export interface TrashBinItemDTO {
    id: string;
    title: string;
    createdBy: TrashBinIdentity;
    deletedBy: TrashBinIdentity;
    deletedOn: string;
    location: TrashBinLocation;
    [key: string]: any;
}

export class TrashBinItem {
    public id: string;
    public title: string;
    public location: TrashBinLocation;
    public createdBy: TrashBinIdentity;
    public deletedOn: string;
    public deletedBy: TrashBinIdentity;

    protected constructor(item: TrashBinItemDTO) {
        this.id = item.id;
        this.title = item.title;
        this.location = item.location;
        this.createdBy = item.createdBy;
        this.deletedOn = item.deletedOn;
        this.deletedBy = item.deletedBy;
    }

    static create(item: TrashBinItemDTO) {
        return new TrashBinItem(item);
    }
}
