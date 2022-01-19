import { AfterModelUpdateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterModelUpdate: Topic<AfterModelUpdateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelUpdate = (params: Params) => {
    const { onAfterModelUpdate, context } = params;

    onAfterModelUpdate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
