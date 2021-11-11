import { AfterModelDeleteTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterDelete: Topic<AfterModelDeleteTopicParams>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: Params) => {
    const { onAfterDelete, context } = params;

    onAfterDelete.subscribe(async () => {
        await context.cms.settings.updateContentModelLastChange();
    });
};
