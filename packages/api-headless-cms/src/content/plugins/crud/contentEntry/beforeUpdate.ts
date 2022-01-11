import { Topic } from "@webiny/pubsub/types";
import { BeforeEntryUpdateTopicParams, CmsContext } from "~/types";
import { markLockedFields } from "./markLockedFields";

export interface Params {
    context: CmsContext;
    onBeforeEntryUpdate: Topic<BeforeEntryUpdateTopicParams>;
}
export const assignBeforeEntryUpdate = (params: Params) => {
    const { context, onBeforeEntryUpdate } = params;

    onBeforeEntryUpdate.subscribe(async params => {
        const { entry, model } = params;

        await markLockedFields({
            model,
            entry,
            context
        });
    });
};
