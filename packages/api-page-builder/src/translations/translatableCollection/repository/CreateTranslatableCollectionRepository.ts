import { PbContext } from "~/types";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GetModel } from "~/translations/GetModel";
import { TranslatableCollectionMapper } from "~/translations/translatableCollection/repository/mappers/TranslatableCollectionMapper";
import { TranslatableCollectionDTO } from "~/translations/translatableCollection/repository/mappers/TranslatableCollectionDTO";

export class CreateTranslatableCollectionRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collection: TranslatableCollection): Promise<void> {
        const model = await GetModel.byModelId(this.context, "translatableCollection");

        await this.context.cms.createEntry<TranslatableCollectionDTO>(
            model,
            TranslatableCollectionMapper.toDTO(collection)
        );
    }
}
