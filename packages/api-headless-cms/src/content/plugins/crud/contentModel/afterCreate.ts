import { AfterModelCreateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterCreate: Topic<AfterModelCreateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelCreate = (params: Params) => {
    const { onAfterCreate, context } = params;

    onAfterCreate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
