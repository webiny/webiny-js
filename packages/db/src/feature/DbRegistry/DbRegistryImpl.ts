import type { IRegistry, IRegistryItem, IRegistryRegisterParams } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

export class DbRegistryImpl implements IRegistry {
    private readonly items: GenericRecord<string, IRegistryItem> = {};

    public register<T = unknown>(input: IRegistryRegisterParams<T>): void {
        const key = `${input.app}-${input.tags.sort().join("-")}`;

        if (this.items[key]) {
            throw new Error(
                `Item with app "${input.app}" and tags "${input.tags.join(
                    ", "
                )}" is already registered.`
            );
        }
        this.items[key] = input;
    }

    public getOneItem<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T> {
        const item = this.getItem(cb);
        if (!item) {
            throw new Error("Item not found.");
        }
        return item;
    }

    public getItem<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T> | null {
        const items = this.getItems(cb);
        if (items.length === 0) {
            return null;
        } else if (items.length > 1) {
            throw new Error("More than one item found with the provided criteria.");
        }
        return items[0];
    }

    public getItems<T = unknown>(cb: (item: IRegistryItem<T>) => boolean): IRegistryItem<T>[] {
        const results: IRegistryItem<T>[] = [];
        for (const key in this.items) {
            const item = this.items[key] as IRegistryItem<T>;
            if (cb(item)) {
                results.push(item);
            }
        }

        return results;
    }
}
