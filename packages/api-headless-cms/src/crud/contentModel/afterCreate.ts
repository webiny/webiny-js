import { AfterModelCreateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelCreateParams {
    onModelAfterCreate: Topic<AfterModelCreateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelCreate = (params: AssignAfterModelCreateParams) => {
    const { onModelAfterCreate, context } = params;

    onModelAfterCreate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
