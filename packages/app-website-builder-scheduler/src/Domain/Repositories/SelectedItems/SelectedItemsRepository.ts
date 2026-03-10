import { makeAutoObservable } from "mobx";
import type { WbSchedulerItem } from "~/Domain/index.js";
import type { ISelectedItemsRepository } from "./ISelectedItemsRepository.js";

export class SelectedItemsRepository implements ISelectedItemsRepository {
    private items: WbSchedulerItem[] = [];
    private selectedAll = false;

    public constructor() {
        makeAutoObservable(this);
    }

    public getSelectedItems() {
        return this.items;
    }

    public getSelectedAllItems() {
        return this.selectedAll;
    }

    public async selectItems(items: WbSchedulerItem[]) {
        this.items = items;
        this.selectedAll = false;
    }

    public async selectAllItems() {
        this.selectedAll = true;
    }

    public async unselectAllItems() {
        this.items = [];
        this.selectedAll = false;
    }
}
