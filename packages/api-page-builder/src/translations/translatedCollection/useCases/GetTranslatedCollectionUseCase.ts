import { PbContext } from "~/types";
import { GetTranslatedCollectionRepository } from "~/translations/translatedCollection/repository/GetTranslatedCollectionRepository";
import type { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";

interface GetTranslatedCollectionParams {
    collectionId: string;
    languageCode: string;
}

export class GetTranslatedCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(params: GetTranslatedCollectionParams): Promise<TranslatedCollection> {
        const getCollection = new GetTranslatedCollectionRepository(this.context);
        return await getCollection.execute(params);
    }
}
