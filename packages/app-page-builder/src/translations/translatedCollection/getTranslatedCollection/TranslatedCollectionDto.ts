import { GenericRecord } from "@webiny/app/types";

export interface TranslatedCollectionDto {
    collectionId: string;
    languageCode: string;
    items: Array<{
        itemId: string;
        baseValue: string;
        baseValueModifiedOn: string;
        value?: string;
        context?: GenericRecord<string>;
        translatedOn?: Date;
        translatedBy?: {
            id: string;
            displayName: string;
        };
    }>;
}
