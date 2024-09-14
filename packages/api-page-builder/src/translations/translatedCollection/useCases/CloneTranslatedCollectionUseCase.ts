import { PbContext } from "~/graphql/types";
import { GetTranslatedCollectionUseCase, SaveTranslatedCollectionUseCase } from "~/translations";
import { TranslatedCollection } from "../domain/TranslatedCollection";

interface CloneTranslatableCollectionParams {
    sourceCollectionId: string;
    newCollectionId: string;
    languageCode: string;
}

export class CloneTranslatedCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute({
        sourceCollectionId,
        newCollectionId,
        languageCode
    }: CloneTranslatableCollectionParams): Promise<TranslatedCollection> {
        // Clone the translated collection.
        const getTranslatedCollection = new GetTranslatedCollectionUseCase(this.context);
        const saveTranslatedCollection = new SaveTranslatedCollectionUseCase(this.context);

        const baseTranslatedCollection = await getTranslatedCollection.execute({
            collectionId: sourceCollectionId,
            languageCode: languageCode
        });

        return await saveTranslatedCollection.execute({
            collectionId: newCollectionId,
            languageCode: languageCode,
            items: baseTranslatedCollection.getItems().map(item => ({
                itemId: item.itemId,
                value: item.value
            }))
        });
    }
}
