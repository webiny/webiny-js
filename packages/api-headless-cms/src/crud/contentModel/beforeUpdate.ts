import { Topic } from "@webiny/pubsub/types";
import { OnModelBeforeUpdateTopicParams, HeadlessCmsStorageOperations, CmsContext } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
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
        /**
         * then the model and fields...
         */
        await validateModel({
            model,
            original,
            context
        });
    });
};
