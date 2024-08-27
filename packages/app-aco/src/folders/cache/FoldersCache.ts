import { makeAutoObservable } from "mobx";
import { Folder } from "~/folders/domain";
import { ICache } from "./ICache";

export class FoldersCache implements ICache<Folder> {
    private folders: Folder[];

    constructor() {
        this.folders = [];
        makeAutoObservable(this);
    }

    getItems() {
        return this.folders;
    }

    async set(item: Folder): Promise<void> {
        this.folders.push(item);
    }

    async setMultiple(items: Folder[]): Promise<void> {
        this.folders = items;
    }

    async update(id: string, item: Folder): Promise<void> {
        const folderIndex = this.folders.findIndex(f => f.id === id);

        if (folderIndex > -1) {
            this.folders[folderIndex] = {
                ...this.folders[folderIndex],
                ...item
            };
        }
    }

    async remove(id: string): Promise<void> {
        this.folders = this.folders.filter(folder => folder.id !== id);
    }
}
