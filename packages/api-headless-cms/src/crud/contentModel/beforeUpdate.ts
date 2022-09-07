import { Topic } from "@webiny/pubsub/types";
import { BeforeModelUpdateTopicParams, HeadlessCmsStorageOperations } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModel } from "./validateModel";

interface AssignBeforeModelUpdateParams {
    onBeforeModelUpdate: Topic<BeforeModelUpdateTopicParams>;
    storageOperations: HeadlessCmsStorageOperations;
    plugins: PluginsContainer;
}

export const assignBeforeModelUpdate = (params: AssignBeforeModelUpdateParams) => {
    const { onBeforeModelUpdate, plugins } = params;

    onBeforeModelUpdate.subscribe(async params => {
        await validateModel({
            model: params.model,
            plugins
        });
    });
};
