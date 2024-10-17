import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { TranslatedCollectionDTO } from "~/translations/translatedCollection/repository/mappers/TranslatedCollectionDTO";
import { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";
import { TranslatedCollectionMapper } from "~/translations/translatedCollection/repository/mappers/TranslatedCollectionMapper";

export class CreateTranslatedCollectionRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collection: TranslatedCollection): Promise<void> {
        const model = await GetModel.byModelId(this.context, "translatedCollection");

        await this.context.cms.createEntry<TranslatedCollectionDTO>(
            model,
            TranslatedCollectionMapper.toDTO(collection)
        );
    }
}
