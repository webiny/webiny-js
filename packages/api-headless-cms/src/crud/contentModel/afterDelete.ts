import { OnModelAfterDeleteTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelDeleteParams {
    onModelAfterDelete: Topic<OnModelAfterDeleteTopicParams>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: AssignAfterModelDeleteParams) => {
    const { onModelAfterDelete, context } = params;

    onModelAfterDelete.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
