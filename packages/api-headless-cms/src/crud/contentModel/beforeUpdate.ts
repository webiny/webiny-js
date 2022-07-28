import { Topic } from "@webiny/pubsub/types";
import { BeforeModelUpdateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModelFields } from "./validateModelFields";

interface AssignBeforeModelUpdateParams {
    onBeforeModelUpdate: Topic<BeforeModelUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

export const assignBeforeModelUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onBeforeModelUpdate, plugins } = params;

    onBeforeModelUpdate.subscribe(async params => {
        await validateModelFields({
            model: params.model,
            plugins
        });
    });
};
