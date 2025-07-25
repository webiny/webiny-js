import { makeAutoObservable } from "mobx";
import { SchedulerItem } from "~/Domain";
import { ISelectedItemsRepository } from "./ISelectedItemsRepository";

export class SelectedItemsRepository implements ISelectedItemsRepository {
    private items: SchedulerItem[] = [];
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

    public async selectItems(items: SchedulerItem[]) {
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
