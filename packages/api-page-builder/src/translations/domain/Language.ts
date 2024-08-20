import { CmsEntry } from "@webiny/api-headless-cms/types";

export interface LanguageFields {
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    baseLanguage: boolean;
}

export class Language {
    public readonly id: string;
    public readonly name: string;
    public readonly code: string;
    public readonly isBaseLanguage: boolean;

    private constructor(id: string, name: string, code: string, isBaseLanguage: boolean) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.isBaseLanguage = isBaseLanguage;
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
