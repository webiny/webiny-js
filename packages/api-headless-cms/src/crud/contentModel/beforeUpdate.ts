import { Topic } from "@webiny/pubsub/types";
import { CmsContext, OnModelBeforeUpdateTopicParams } from "~/types";
import { validateModel } from "./validateModel";
import { validateSingularApiName } from "./validate/singularApiName";
import { validatePluralApiName } from "./validate/pluralApiName";
import { validateEndingAllowed } from "~/crud/contentModel/validate/endingAllowed";

interface AssignBeforeModelUpdateParams {
    onModelBeforeUpdate: Topic<OnModelBeforeUpdateTopicParams>;
    context: CmsContext;
}

export const assignModelBeforeUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onModelBeforeUpdate, context } = params;

    onModelBeforeUpdate.subscribe(async ({ model: newModel, original }) => {
        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => {
                return model.modelId !== newModel.modelId;
            });
        });

        validateEndingAllowed({
            model: newModel
        });
        /**
         * We need to check for the existence of:
         * - modelId
         * - singularApiName
         * - pluralApiName
         */
        for (const model of models) {
            validateSingularApiName({
                existingModel: model,
                model: newModel
            });
            validatePluralApiName({
                existingModel: model,
                model: newModel
            });
        }
        /**
         * then the model and fields...
         */
        await validateModel({
            models,
            model: newModel,
            original,
            context
        });
    });
};
