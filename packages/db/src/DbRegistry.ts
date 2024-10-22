import { IRegistry, IRegistryItem, IRegistryRegisterParams } from "./types";

export class DbRegistry implements IRegistry {
    private readonly items: IRegistryItem[] = [];

    public register<T = unknown>(input: IRegistryRegisterParams<T>): void {
        const existing = this.items.some(item => {
            if (item.app !== input.app) {
                return false;
            }
            for (const tag of input.tags) {
                if (item.tags.includes(tag)) {
                    return true;
                }
            }
            const hasAllTags = input.tags.every(tag => {
                return item.tags.includes(tag);
            });
            if (!hasAllTags) {
                return false;
            }
            return item.tags.length === input.tags.length;
        });
        if (existing) {
            throw new Error(
                `Item with app "${input.app}" and tags "${input.tags.join(
                    ", "
                )}" is already registered.`
            );
        }
        this.items.push(input);
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
        return (this.items as IRegistryItem<T>[]).filter(cb);
    }
}
