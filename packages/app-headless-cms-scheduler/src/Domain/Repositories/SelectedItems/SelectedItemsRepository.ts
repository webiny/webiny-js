import { makeAutoObservable } from "mobx";
import { SchedulerItem } from "~/Domain";
import { ISelectedItemsRepository } from "./ISelectedItemsRepository";

export class SelectedItemsRepository implements ISelectedItemsRepository {
    private items: SchedulerItem[] = [];
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

    async selectItems(items: SchedulerItem[]) {
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
