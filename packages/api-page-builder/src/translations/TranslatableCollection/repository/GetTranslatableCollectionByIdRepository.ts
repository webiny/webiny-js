import { WebinyError } from "@webiny/error";
import { PbContext } from "~/types";
import { TranslatableCollectionDTO } from "~/translations/types";
import { TranslatableCollection } from "~/translations/TranslatableCollection/TranslatableCollection";
import { GetModel } from "~/translations/GetModel";
import { TranslatableCollectionMapper } from "~/translations/TranslatableCollection/repository/TranslatableCollectionMapper";

export class GetTranslatableCollectionByIdRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collectionId: string): Promise<TranslatableCollection> {
        const model = await GetModel.byModelId(this.context, "translatableCollection");

        const existingEntry = await this.context.cms.getEntry<TranslatableCollectionDTO>(model, {
            where: { collectionId, latest: true }
        });

        if (!existingEntry) {
            throw new WebinyError({
                message: `TranslatableCollection "${collectionId}" not found!`,
                code: "NOT_FOUND"
            });
        }

        return TranslatableCollectionMapper.fromDTO(existingEntry.values);
    }
}
