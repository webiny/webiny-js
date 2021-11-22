import { Topic } from "@webiny/pubsub/types";
import { AfterEntryDeleteTopicParams, CmsContext } from "~/types";
import { markUnlockedFields } from "./markLockedFields";

export interface Params {
    context: CmsContext;
    onAfterDelete: Topic<AfterEntryDeleteTopicParams>;
}
export const assignAfterEntryDelete = (params: Params) => {
    const { context, onAfterDelete } = params;

    onAfterDelete.subscribe(async params => {
        const { entry, model } = params;

        const { items } = await context.cms.storageOperations.entries.list(model, {
            where: {
                entryId_not: entry.entryId,
                latest: true
            },
            limit: 1
        });
        if (items.length > 0) {
            return;
        }
        await markUnlockedFields({
            context,
            model
        });
    });
};
