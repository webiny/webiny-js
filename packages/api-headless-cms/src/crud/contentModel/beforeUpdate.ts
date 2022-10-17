import { Topic } from "@webiny/pubsub/types";
import { OnModelBeforeUpdateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModelFields } from "./validateModelFields";

interface AssignBeforeModelUpdateParams {
    onModelBeforeUpdate: Topic<OnModelBeforeUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

export const assignBeforeModelUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onModelBeforeUpdate, plugins } = params;

    onModelBeforeUpdate.subscribe(async params => {
        await validateModelFields({
            model: params.model,
            plugins
        });
    });
};
