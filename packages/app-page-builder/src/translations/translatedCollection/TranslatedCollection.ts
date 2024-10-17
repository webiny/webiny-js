import { GenericRecord } from "@webiny/app/types";

export interface TranslatedCollection<
    TContext extends GenericRecord<string> = GenericRecord<string>
> {
    collectionId: string;
    languageCode: string;
    items: Array<{
        itemId: string;
        baseValue: string;
        baseValueModifiedOn: Date;
        value?: string;
        context?: TContext;
        translatedOn?: Date;
        translatedBy?: {
            id: string;
            displayName: string;
        };
    }>;
}
