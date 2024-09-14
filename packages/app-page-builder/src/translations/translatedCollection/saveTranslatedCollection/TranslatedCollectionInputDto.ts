export interface TranslatedCollectionInputDto {
    collectionId: string;
    languageCode: string;
    items: Array<{
        itemId: string;
        value?: string;
    }>;
}
