import { Topic } from "@webiny/pubsub/types";
import { BeforeCreateEntryTopic, CmsContext } from "~/types";
import { markLockedFields } from "./markLockedFields";

export interface Params {
    context: CmsContext;
    onBeforeCreate: Topic<BeforeCreateEntryTopic>;
}
export const assignBeforeEntryCreate = (params: Params) => {
    const { context, onBeforeCreate } = params;

    onBeforeCreate.subscribe(async params => {
        const { entry, model } = params;

        await markLockedFields({
            model,
            entry,
            context
        });
    });
};
