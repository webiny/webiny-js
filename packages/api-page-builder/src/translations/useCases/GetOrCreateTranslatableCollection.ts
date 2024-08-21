import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { TranslatableCollectionDTO } from "~/translations/types";
import { TranslatableCollection } from "~/translations/TranslatableCollection/TranslatableCollection";
import { GetTranslatableCollectionByIdRepository } from "~/translations/TranslatableCollection/repository/GetTranslatableCollectionByIdRepository";
import { TranslatableCollectionMapper } from "~/translations/TranslatableCollection/repository/TranslatableCollectionMapper";

export class GetOrCreateTranslatableCollection {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collectionId: string): Promise<TranslatableCollection> {
        const model = await GetModel.byModelId(this.context, "translatableCollection");

        try {
            const getById = new GetTranslatableCollectionByIdRepository(this.context);
            return await getById.execute(collectionId);
        } catch (err) {
            if (err.code === "NOT_FOUND") {
                const newEntry = await this.context.cms.createEntry<TranslatableCollectionDTO>(
                    model,
                    {
                        collectionId
                    }
                );

                return TranslatableCollectionMapper.fromDTO(newEntry.values);
            }

            throw err;
        }
    }
}
