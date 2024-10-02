import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GqlTranslatableCollectionDTO } from "~/translations/translatableCollection/graphql/GqlTranslatableCollectionDTO";
import { GqlTranslatableItemMapper } from "~/translations/translatableCollection/graphql/GqlTranslatableItemMapper";

export class GqlTranslatableCollectionMapper {
    static toDTO(collection: TranslatableCollection): GqlTranslatableCollectionDTO {
        return {
            id: collection.getId() || collection.getCollectionId(),
            collectionId: collection.getCollectionId(),
            lastModified: collection.getLastModified()?.toISOString(),
            items: collection.getItems().map(item => GqlTranslatableItemMapper.toDTO(item))
        };
    }
}
