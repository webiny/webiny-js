import { AfterModelCreateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterModelCreate: Topic<AfterModelCreateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelCreate = (params: Params) => {
    const { onAfterModelCreate, context } = params;

    onAfterModelCreate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
