import { TranslatableCollectionDTO } from "~/translations/types";
import { TranslatableItemMapper } from "~/translations/TranslatableCollection/repository/TranslatableItemMapper";
import { TranslatableCollection } from "~/translations/TranslatableCollection/TranslatableCollection";

export class TranslatableCollectionMapper {
    static fromDTO(dto: TranslatableCollectionDTO) {
        return new TranslatableCollection(
            dto.collectionId,
            dto.items.map(item => TranslatableItemMapper.fromDTO(item))
        );
    }

    static toDTO(collection: TranslatableCollection) {
        return {
            collectionId: collection.collectionId,
            items: collection.items.map(item => TranslatableItemMapper.toDTO(item))
        };
    }
}
