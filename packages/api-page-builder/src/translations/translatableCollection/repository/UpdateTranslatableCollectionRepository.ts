import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { TranslatableCollectionMapper } from "~/translations/translatableCollection/repository/mappers/TranslatableCollectionMapper";
import { WebinyError } from "@webiny/error";
import { createIdentifier } from "@webiny/utils";

export class UpdateTranslatableCollectionRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collection: TranslatableCollection): Promise<void> {
        const model = await GetModel.byModelId(this.context, "translatableCollection");
        const dto = TranslatableCollectionMapper.toDTO(collection);

        if (!dto.id) {
            throw new WebinyError({
                message: "Updating a record without an ID is not allowed!",
                code: "UPDATE_WITHOUT_ID_NOT_ALLOWED"
            });
        }

        const cmsId = createIdentifier({
            id: dto.id,
            version: 1
        });

        await this.context.cms.updateEntry(model, cmsId, dto);
    }
}
