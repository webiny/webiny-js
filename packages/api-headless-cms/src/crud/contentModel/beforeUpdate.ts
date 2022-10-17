import { Topic } from "@webiny/pubsub/types";
import { OnModelBeforeUpdateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModel } from "./validateModel";
import { validateLayout } from "./validateLayout";

interface AssignBeforeModelUpdateParams {
    onModelBeforeUpdate: Topic<OnModelBeforeUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

export const assignBeforeModelUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onModelBeforeUpdate, plugins } = params;
    
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
            plugins
        });
    });
};
