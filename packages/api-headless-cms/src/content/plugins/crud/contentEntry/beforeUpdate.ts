import { Topic } from "@webiny/pubsub/types";
import { BeforeUpdateEntryTopic, CmsContext } from "~/types";
import { markLockedFields } from "./markLockedFields";

export interface Params {
    context: CmsContext;
    onBeforeUpdate: Topic<BeforeUpdateEntryTopic>;
}
export const assignBeforeEntryUpdate = (params: Params) => {
    const { context, onBeforeUpdate } = params;

    onBeforeUpdate.subscribe(async params => {
        const { entry, model } = params;

        await markLockedFields({
            model,
            entry,
            context
        });
    });
};
