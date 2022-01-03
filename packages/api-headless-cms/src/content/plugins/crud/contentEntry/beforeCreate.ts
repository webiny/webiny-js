import { Topic } from "@webiny/pubsub/types";
import { BeforeEntryCreateTopicParams, CmsContext } from "~/types";
import { markLockedFields } from "./markLockedFields";

export interface Params {
    context: CmsContext;
    onBeforeEntryCreate: Topic<BeforeEntryCreateTopicParams>;
}
export const assignBeforeEntryCreate = (params: Params) => {
    const { context, onBeforeEntryCreate } = params;

    onBeforeEntryCreate.subscribe(async params => {
        const { entry, model } = params;

        await markLockedFields({
            model,
            entry,
            context
        });
    });
};
