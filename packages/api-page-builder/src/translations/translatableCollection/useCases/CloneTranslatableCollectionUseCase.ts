import { WebinyError } from "@webiny/error";
import { PbContext } from "~/graphql/types";
import {
    GetTranslatableCollectionUseCase,
    SaveTranslatableCollectionUseCase
} from "~/translations";
import { TranslatableCollection } from "../domain/TranslatableCollection";

interface CloneTranslatableCollectionParams {
    sourceCollectionId: string;
    newCollectionId: string;
}

export class CloneTranslatableCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute({
        sourceCollectionId,
        newCollectionId
    }: CloneTranslatableCollectionParams): Promise<TranslatableCollection> {
        // Clone the translatable collection.
        const getCollection = new GetTranslatableCollectionUseCase(this.context);
        const baseCollection = await getCollection.execute(sourceCollectionId);

        if (!baseCollection) {
            throw new WebinyError({
                code: "SOURCE_COLLECTION_NOT_FOUND",
                message: `TranslatableCollection ${sourceCollectionId} was not found!`
            });
        }

        const saveCollection = new SaveTranslatableCollectionUseCase(this.context);

        return await saveCollection.execute({
            collectionId: newCollectionId,
            items: baseCollection.getItems().map(item => ({
                itemId: item.itemId,
                value: item.value,
                // We want to preserve the modification date, so we forward the current value!
                modifiedOn: item.modifiedOn.toISOString(),
                context: item.context
            }))
        });
    }
}
