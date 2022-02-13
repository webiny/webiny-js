import { AfterModelUpdateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelUpdateParams {
    onAfterModelUpdate: Topic<AfterModelUpdateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelUpdate = (params: AssignAfterModelUpdateParams) => {
    const { onAfterModelUpdate, context } = params;

    onAfterModelUpdate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
