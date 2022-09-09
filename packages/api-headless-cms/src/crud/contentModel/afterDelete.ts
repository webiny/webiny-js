import { AfterModelDeleteTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelDeleteParams {
    onModelAfterDelete: Topic<AfterModelDeleteTopicParams>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: AssignAfterModelDeleteParams) => {
    const { onModelAfterDelete, context } = params;

    onModelAfterDelete.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
