import { TranslatableItem } from "./TranslatableItem";

export interface TranslatableCollectionProps {
    collectionId: string;
    items?: TranslatableItem[];
}

export class TranslatableCollection {
    private readonly props: TranslatableCollectionProps;
    private id?: string;

    constructor(props: TranslatableCollectionProps, id?: string) {
        this.props = props;
        this.id = id;
    }

    getId() {
        return this.id;
    }

    setId(id: string) {
        if (!this.id) {
            this.id = id;
        }
    }

    getCollectionId() {
        return this.props.collectionId;
    }

    getItems() {
        return this.props.items || [];
    }

    public setItems(items: TranslatableItem[]) {
        const newItems: TranslatableItem[] = [];

        for (const item of items) {
            const existingItem = this.getItems().find(
                existingItem => existingItem.itemId === item.itemId
            );

            if (!existingItem) {
                newItems.push(item);
                continue;
            }

            newItems.push(
                existingItem.update({
                    value: item.value,
                    modifiedBy: item.modifiedBy,
                    context: item.context ?? existingItem.context
                })
            );
        }

        this.props.items = newItems;
    }

    getLastModified() {
        return this.getItems()
            .map(item => item.modifiedOn)
            .sort((a, b) => a.getTime() - b.getTime())
            .pop();
    }

    getBaseValue(itemId: string) {
        const item = this.getItems().find(item => item.itemId === itemId);
        return item ? item.value : undefined;
    }

    getItemContext(itemId: string) {
        const item = this.getItems().find(item => item.itemId === itemId);
        return item ? item.context : undefined;
    }

    getItemModifiedOn(itemId: string) {
        const item = this.getItems().find(item => item.itemId === itemId);
        return item ? item.modifiedOn : undefined;
    }
}
