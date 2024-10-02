import { PbContext } from "~/types";
import { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";
import { GetTranslatedCollectionUseCase } from "~/translations/translatedCollection/useCases/GetTranslatedCollectionUseCase";
import { GetOrCreateTranslatableCollectionUseCase } from "~/translations/translatableCollection/useCases/GetOrCreateTranslatableCollectionUseCase";
import { TranslatedItem } from "~/translations/translatedCollection/domain/TranslatedItem";

interface GetTranslatedCollectionParams {
    collectionId: string;
    languageCode: string;
}

export class GetOrCreateTranslatedCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(params: GetTranslatedCollectionParams): Promise<TranslatedCollection> {
        // Get base collection.
        const getBaseCollection = new GetOrCreateTranslatableCollectionUseCase(this.context);
        const baseCollection = await getBaseCollection.execute(params.collectionId);

        let translatedCollection: TranslatedCollection;

        try {
            const getTranslatedCollection = new GetTranslatedCollectionUseCase(this.context);
            translatedCollection = await getTranslatedCollection.execute(params);
        } catch (err) {
            if (err.code !== "NOT_FOUND") {
                throw err;
            }

            translatedCollection = new TranslatedCollection({
                collectionId: params.collectionId,
                languageCode: params.languageCode,
                items: []
            });
        }

        // Make sure the `TranslatedCollection` is in sync with its base `TranslatableCollection`.
        const translatedItems = translatedCollection.getItems();

        const syncItems = baseCollection.getItems().map(bi => {
            const matchingItem = translatedItems.find(ti => ti.itemId === bi.itemId);

            if (matchingItem) {
                return matchingItem;
            }

            return TranslatedItem.create({ itemId: bi.itemId });
        });

        translatedCollection.setItems(syncItems);

        return translatedCollection;
    }
}
