export interface LanguageProps {
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    isBaseLanguage: boolean;
}

export class Language {
    private readonly id: string | undefined;
    private readonly props: LanguageProps;

    constructor(props: LanguageProps, id?: string) {
        this.props = props;
        this.id = id;
    }

    getId() {
        return this.id || this.props.code;
    }

    getName() {
        return this.props.name;
    }

    getCode() {
        return this.props.code;
    }

    getDirection() {
        return this.props.direction;
    }

    isBaseLanguage() {
        return this.props.isBaseLanguage;
    }
}
