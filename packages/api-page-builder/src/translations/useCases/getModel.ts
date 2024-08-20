import {
    TRANSLATION_LANGUAGE_MODEL,
    TRANSLATABLE_COLLECTION_MODEL,
    TRANSLATED_COLLECTION_MODEL
} from "~/translations/constants";
import { PbContext } from "~/graphql/types";

type ModelId =
    | typeof TRANSLATION_LANGUAGE_MODEL
    | typeof TRANSLATABLE_COLLECTION_MODEL
    | typeof TRANSLATED_COLLECTION_MODEL;

export class GetModel {
    static async byModelId(context: PbContext, modelId: ModelId) {
        const model = await context.cms.getModel(modelId);

        if (!model) {
            throw new Error(`Model "${modelId}" was not found!`);
        }

        return model;
    }
}
