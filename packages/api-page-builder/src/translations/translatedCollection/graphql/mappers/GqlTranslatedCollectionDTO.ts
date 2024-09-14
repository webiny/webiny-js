import { Identity } from "~/translations/Identity";

export interface GqlTranslatedCollectionDTO {
    collectionId: string;
    languageCode: string;
    items: Array<{
        itemId: string;
        baseValue: () => string;
        baseValueModifiedOn: () => string;
        value?: string;
        translatedOn?: string;
        translatedBy?: Identity;
    }>;
}
