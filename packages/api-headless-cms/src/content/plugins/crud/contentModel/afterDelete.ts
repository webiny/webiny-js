import { AfterModelDeleteTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelDeleteParams {
    onAfterModelDelete: Topic<AfterModelDeleteTopicParams>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: AssignAfterModelDeleteParams) => {
    const { onAfterModelDelete, context } = params;

    onAfterModelDelete.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
