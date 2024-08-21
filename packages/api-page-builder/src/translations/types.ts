export type DateISOString = string;

export interface TranslatableItemDTO {
    itemId: string;
    value: string;
    modifiedOn?: DateISOString;
}

export interface TranslatableCollectionDTO {
    collectionId: string;
    items: TranslatableItemDTO[];
}

export interface LanguageDTO {
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    baseLanguage: boolean;
}
