export class TranslatableItem {
    public readonly itemId: string;
    public readonly value: string;
    public readonly modifiedOn: Date;

    constructor(itemId: string, value: string, modifiedOn: Date) {
        this.itemId = itemId;
        this.value = value;
        this.modifiedOn = modifiedOn;
    }

    setValue(value: string): TranslatableItem {
        if (value === this.value) {
            return this;
        }

        return new TranslatableItem(this.itemId, value, new Date());
    }
}
