import { CmsEntry } from "@webiny/api-headless-cms/types";

export interface LanguageFields {
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    baseLanguage: boolean;
}

export class Language {
    private id: string;
    private name: string;
    private code: string;
    private isBase: boolean;

    private constructor(id: string, name: string, code: string, isBase: boolean) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.isBase = isBase;
    }

    static fromEntry(entry: CmsEntry<LanguageFields>) {
        return new Language(
            entry.id,
            entry.values.name,
            entry.values.code,
            entry.values.baseLanguage
        );
    }
}
