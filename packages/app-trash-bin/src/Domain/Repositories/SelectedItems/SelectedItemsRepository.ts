import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "~/Domain";
import { ISelectedItemsRepository } from "./ISelectedItemsRepository";

export class SelectedItemsRepository implements ISelectedItemsRepository {
    private items: TrashBinItem[] = [];
    private selectedAll = false;

    constructor() {
        makeAutoObservable(this);
    }

    getSelectedItems() {
        return this.items;
    }

    getSelectedAllItems() {
        return this.selectedAll;
    }

    async selectItems(items: TrashBinItem[]) {
        this.items = items;
        this.selectedAll = false;
    }

    async selectAllItems() {
        this.selectedAll = true;
    }

    async unselectAllItems() {
        this.items = [];
        this.selectedAll = false;
    }
}
