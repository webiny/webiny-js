import { Topic } from "@webiny/pubsub/types";
import { AfterEntryDeleteTopicParams, CmsContext } from "~/types";
import { markUnlockedFields } from "./markLockedFields";

interface AssignAfterEntryDeleteParams {
    context: CmsContext;
    onAfterEntryDelete: Topic<AfterEntryDeleteTopicParams>;
}
export const assignAfterEntryDelete = (params: AssignAfterEntryDeleteParams) => {
    const { context, onAfterEntryDelete } = params;

    onAfterEntryDelete.subscribe(async params => {
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
