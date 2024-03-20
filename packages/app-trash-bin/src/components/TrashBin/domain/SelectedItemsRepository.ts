import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectedItemsRepository } from "~/components/TrashBin/abstractions";

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
