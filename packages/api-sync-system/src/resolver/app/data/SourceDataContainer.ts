import { GenericRecord } from "@webiny/api/types";
import type { IInputItem, IItem, ISourceDataContainer } from "~/resolver/app/data/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";

export class SourceDataContainer implements ISourceDataContainer {
    public readonly items: GenericRecord<string, IItem> = {};

    private constructor() {
        // block
    }

    public static create(): ISourceDataContainer {
        return new SourceDataContainer();
    }

    public get(input: IInputItem): IStoreItem | null {
        const key = this.createKey(input);
        const item = this.items[key];
        return item?.data || null;
    }

    public add(item: IInputItem, data: IStoreItem | null): void {
        const key = this.createKey(item);
        if (this.items[key]) {
            return;
        }

        this.items[key] = {
            ...item,
            data
        };
    }

    public merge(container: ISourceDataContainer): void {
        for (const key in container.items) {
            const item = container.items[key];
            this.add(item, item.data);
        }
    }

    private createKey(item: IInputItem): string {
        return `${item.source.name}#${item.table.name}#${item.PK}#${item.SK}`;
    }
}
