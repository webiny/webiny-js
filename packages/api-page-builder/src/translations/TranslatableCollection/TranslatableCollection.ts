import { TranslatableItem } from "./TranslatableItem";

export class TranslatableCollection {
    public readonly collectionId: string;
    public readonly items: TranslatableItem[];

    constructor(collectionId: string, items: TranslatableItem[]) {
        this.collectionId = collectionId;
        this.items = items;
    }

    public setItems(items: TranslatableItem[]) {
        const newItems: TranslatableItem[] = [];

        for (const item of items) {
            const existingItem = this.items.find(
                existingItem => existingItem.itemId === item.itemId
            );

            if (!existingItem) {
                newItems.push(item);
                continue;
            }

            newItems.push(existingItem.setValue(item.value));
        }

        return new TranslatableCollection(this.collectionId, newItems);
    }
}
