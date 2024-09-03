import { TranslatedItemDTO } from "./TranslatedItemDTO";

export interface TranslatedCollectionDTO {
    collectionId: string;
    languageCode: string;
    items: TranslatedItemDTO[];
}
