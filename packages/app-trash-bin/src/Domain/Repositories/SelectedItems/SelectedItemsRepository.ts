import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "~/Domain";
import { ISelectedItemsRepository } from "./ISelectedItemsRepository";

export class SelectedItemsRepository implements ISelectedItemsRepository {
    private items: TrashBinItem[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    getSelectedItems() {
        return this.items;
    }

    async selectItems(items: TrashBinItem[]) {
        this.items = items;
    }
}
