import { Topic } from "@webiny/pubsub/types";
import { BeforeModelUpdateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModel } from "./validateModel";
import { validateLayout } from "./validateLayout";

interface AssignBeforeModelUpdateParams {
    onBeforeModelUpdate: Topic<BeforeModelUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

export const assignBeforeModelUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onBeforeModelUpdate, plugins } = params;

    onBeforeModelUpdate.subscribe(async ({ model }) => {
        /**
         * First we go through the layout...
         */
        validateLayout(model.layout, model.fields);
        /**
         * then the model and fields...
         */
        await validateModel({
            model,
            plugins
        });
    });
};
