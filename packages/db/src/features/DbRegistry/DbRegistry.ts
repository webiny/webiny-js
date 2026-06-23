import type { GenericRecord } from "@webiny/api/types.js";
import { DbRegistry as DbRegistryAbstraction } from "./abstractions.js";

class DbRegistryImpl implements DbRegistryAbstraction.Interface {
    private readonly items: GenericRecord<string, DbRegistryAbstraction.RegistryItem> = {};

    public register<T = unknown>(input: DbRegistryAbstraction.RegisterParams<T>): void {
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

    public getOneItem<T = unknown>(
        cb: (item: DbRegistryAbstraction.RegistryItem<T>) => boolean
    ): DbRegistryAbstraction.RegistryItem<T> {
        const item = this.getItem(cb);
        if (!item) {
            throw new Error("Item not found.");
        }
        return item;
    }

    public getItem<T = unknown>(
        cb: (item: DbRegistryAbstraction.RegistryItem<T>) => boolean
    ): DbRegistryAbstraction.RegistryItem<T> | null {
        const items = this.getItems(cb);
        if (items.length === 0) {
            return null;
        } else if (items.length > 1) {
            throw new Error("More than one item found with the provided criteria.");
        }
        return items[0];
    }

    public getItems<T = unknown>(
        cb: (item: DbRegistryAbstraction.RegistryItem<T>) => boolean
    ): DbRegistryAbstraction.RegistryItem<T>[] {
        const results: DbRegistryAbstraction.RegistryItem<T>[] = [];
        for (const key in this.items) {
            const item = this.items[key] as DbRegistryAbstraction.RegistryItem<T>;
            if (cb(item)) {
                results.push(item);
            }
        }

        return results;
    }
}

export const DbRegistry = DbRegistryAbstraction.createImplementation({
    implementation: DbRegistryImpl,
    dependencies: []
});
