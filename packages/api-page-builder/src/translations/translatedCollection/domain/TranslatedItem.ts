import { Identity } from "~/translations/Identity";

interface TranslatedItemProps {
    itemId: string;
    value?: string;
    translatedOn?: Date;
    translatedBy?: Identity;
}

export class TranslatedItem {
    private readonly props: TranslatedItemProps;

    private constructor(props: TranslatedItemProps) {
        this.props = props;
    }

    get itemId() {
        return this.props.itemId;
    }

    get value() {
        return this.props.value;
    }

    get translatedOn() {
        return this.props.translatedOn;
    }

    get translatedBy() {
        return this.props.translatedBy;
    }

    static create(props: TranslatedItemProps) {
        return new TranslatedItem(props);
    }

    translatedAfter(date: Date) {
        return this.translatedOn && this.translatedOn.getTime() > date.getTime();
    }
}
