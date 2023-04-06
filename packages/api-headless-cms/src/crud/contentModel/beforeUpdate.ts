import { Topic } from "@webiny/pubsub/types";
import { OnModelBeforeUpdateTopicParams, CmsContext } from "~/types";
import { validateModel } from "./validateModel";
import { validateLayout } from "./validateLayout";

interface AssignBeforeModelUpdateParams {
    onModelBeforeUpdate: Topic<OnModelBeforeUpdateTopicParams>;
    context: CmsContext;
}

export const assignModelBeforeUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onModelBeforeUpdate, context } = params;

    onModelBeforeUpdate.subscribe(async ({ model, original }) => {
        /**
         * First we go through the layout...
         */
        validateLayout(model.layout, model.fields);

        const models = await context.security.withoutAuthorization(async () => {
            return context.cms.listModels();
        });
        /**
         * then the model and fields...
         */
        await validateModel({
            models,
            model,
            original,
            context
        });
    });
};
