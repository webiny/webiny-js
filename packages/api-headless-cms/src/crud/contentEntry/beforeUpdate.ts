import { Topic } from "@webiny/pubsub/types";
import { OnEntryBeforeUpdateTopicParams, CmsContext } from "~/types";
import { markLockedFields } from "./markLockedFields";

interface AssignBeforeEntryUpdateParams {
    context: CmsContext;
    onEntryBeforeUpdate: Topic<OnEntryBeforeUpdateTopicParams>;
}
export const assignBeforeEntryUpdate = (params: AssignBeforeEntryUpdateParams) => {
    const { context, onEntryBeforeUpdate } = params;

    onEntryBeforeUpdate.subscribe(async params => {
        const { entry, model } = params;

        await markLockedFields({
            model,
            entry,
            context
        });
    });
};
