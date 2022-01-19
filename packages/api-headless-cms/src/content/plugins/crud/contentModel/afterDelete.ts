import { AfterModelDeleteTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterModelDelete: Topic<AfterModelDeleteTopicParams>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: Params) => {
    const { onAfterModelDelete, context } = params;

    onAfterModelDelete.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
