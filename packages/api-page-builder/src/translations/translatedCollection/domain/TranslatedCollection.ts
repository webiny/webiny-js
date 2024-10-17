import { TranslatedItem } from "./TranslatedItem";

interface TranslatedCollectionProps {
    collectionId: string;
    languageCode: string;
    items: TranslatedItem[];
}

export class TranslatedCollection {
    private props: TranslatedCollectionProps;
    private id?: string;

    constructor(props: TranslatedCollectionProps, id?: string) {
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

    getLanguageCode() {
        return this.props.languageCode;
    }

    getItems() {
        return this.props.items;
    }

    setItems(items: TranslatedItem[]) {
        this.props.items = items;
    }

    updateItems(newItems: TranslatedItem[]) {
        const items = this.getItems().map(item => {
            const newItem = newItems.find(newItem => newItem.itemId === item.itemId);

            // You can't set an item that doesn't exist in the original collection.
            if (!newItem) {
                return item;
            }

            if (newItem.value !== item.value) {
                return newItem;
            }

            return item;
        });

        this.props.items = items;
    }

    getTranslatedValue(itemId: string) {
        const item = this.getItems().find(item => item.itemId === itemId);
        return item ? item.value : undefined;
    }
}
