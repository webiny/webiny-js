import { PbContext } from "~/types";
import { TranslatableCollectionDTO } from "~/translations/types";
import { TranslatableCollection } from "~/translations/TranslatableCollection/TranslatableCollection";
import { GetModel } from "~/translations/GetModel";
import { TranslatableCollectionMapper } from "~/translations/TranslatableCollection/repository/TranslatableCollectionMapper";

export class UpdateTranslatableCollectionRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collection: TranslatableCollection): Promise<void> {
        const model = await GetModel.byModelId(this.context, "translatableCollection");

        const existingEntry = await this.context.cms.getEntry<TranslatableCollectionDTO>(model, {
            where: { collectionId: collection.collectionId, latest: true }
        });

        await this.context.cms.updateEntry(
            model,
            existingEntry.id,
            TranslatableCollectionMapper.toDTO(collection)
        );
    }
}
