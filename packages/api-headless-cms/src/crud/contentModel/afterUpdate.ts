import { OnModelAfterUpdateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelUpdateParams {
    onModelAfterUpdate: Topic<OnModelAfterUpdateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelUpdate = (params: AssignAfterModelUpdateParams) => {
    const { onModelAfterUpdate, context } = params;

    onModelAfterUpdate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
