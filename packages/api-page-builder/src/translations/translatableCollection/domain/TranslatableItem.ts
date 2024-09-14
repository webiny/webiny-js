import { Identity } from "~/translations/Identity";

interface TranslatableItemProps {
    itemId: string;
    value: string;
    context?: Record<string, any>;
    modifiedOn: Date;
    modifiedBy: Identity;
}

interface UpdateProps {
    value: string;
    context?: Record<string, any>;
    modifiedBy: Identity;
    modifiedOn?: Date;
}

export class TranslatableItem {
    private readonly props: TranslatableItemProps;

    private constructor(props: TranslatableItemProps) {
        this.props = props;
    }

    get itemId() {
        return this.props.itemId;
    }

    get value() {
        return this.props.value;
    }

    get context() {
        return this.props.context;
    }

    get modifiedOn() {
        return this.props.modifiedOn;
    }

    get modifiedBy() {
        return this.props.modifiedBy;
    }

    static create(props: TranslatableItemProps) {
        return new TranslatableItem(props);
    }

    update(props: UpdateProps): TranslatableItem {
        if (props.value === this.props.value) {
            return this;
        }

        return new TranslatableItem({
            ...this.props,
            ...props,
            modifiedOn: props.modifiedOn ?? new Date()
        });
    }
}
