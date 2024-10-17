import { TranslatedCollectionDTO } from "~/translations/translatedCollection/repository/mappers/TranslatedCollectionDTO";
import { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";
import { TranslatedItemMapper } from "~/translations/translatedCollection/repository/mappers/TranslatedItemMapper";

export class TranslatedCollectionMapper {
    static fromDTO(dto: TranslatedCollectionDTO, id?: string): TranslatedCollection {
        return new TranslatedCollection(
            {
                collectionId: dto.collectionId,
                languageCode: dto.languageCode,
                items: dto.items.map(item => TranslatedItemMapper.fromDTO(item))
            },
            id
        );
    }

    static toDTO(collection: TranslatedCollection) {
        return {
            id: collection.getId(),
            collectionId: collection.getCollectionId(),
            languageCode: collection.getLanguageCode(),
            items: collection.getItems().map(item => TranslatedItemMapper.toDTO(item))
        };
    }
}
