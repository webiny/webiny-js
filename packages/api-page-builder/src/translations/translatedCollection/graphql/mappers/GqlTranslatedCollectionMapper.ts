import { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";
import { GqlTranslatedCollectionDTO } from "~/translations/translatedCollection/graphql/mappers/GqlTranslatedCollectionDTO";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";

export class GqlTranslatedCollectionMapper {
    static toDTO(
        baseCollection: TranslatableCollection,
        translatedCollection: TranslatedCollection
    ): GqlTranslatedCollectionDTO {
        return {
            collectionId: translatedCollection.getCollectionId(),
            languageCode: translatedCollection.getLanguageCode(),
            items: translatedCollection.getItems().map(item => {
                return {
                    itemId: item.itemId,
                    baseValue: () => {
                        return baseCollection.getBaseValue(item.itemId) ?? "";
                    },
                    baseValueModifiedOn: () => {
                        const modifiedOn = baseCollection.getItemModifiedOn(item.itemId);

                        return modifiedOn ? modifiedOn.toISOString() : "";
                    },
                    context: () => {
                        return baseCollection.getItemContext(item.itemId);
                    },
                    value: item.value,
                    translatedOn: item.translatedOn?.toISOString(),
                    translatedBy: item.translatedBy
                };
            })
        };
    }
}
