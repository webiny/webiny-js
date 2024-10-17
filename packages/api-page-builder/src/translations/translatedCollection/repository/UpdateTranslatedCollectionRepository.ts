import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { WebinyError } from "@webiny/error";
import { createIdentifier } from "@webiny/utils";
import { TranslatedCollection } from "~/translations/translatedCollection/domain/TranslatedCollection";
import { TranslatedCollectionMapper } from "~/translations/translatedCollection/repository/mappers/TranslatedCollectionMapper";

export class UpdateTranslatedCollectionRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collection: TranslatedCollection): Promise<void> {
        const model = await GetModel.byModelId(this.context, "translatedCollection");
        const dto = TranslatedCollectionMapper.toDTO(collection);

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
