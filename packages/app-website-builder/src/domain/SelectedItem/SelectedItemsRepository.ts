import { makeAutoObservable } from "mobx";
import { ISelectedItemsRepository } from "./ISelectedItemsRepository";

export class SelectedItemsRepository<T = any> implements ISelectedItemsRepository<T> {
    private items: T[] = [];
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

    async selectItems(items: T[]) {
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
