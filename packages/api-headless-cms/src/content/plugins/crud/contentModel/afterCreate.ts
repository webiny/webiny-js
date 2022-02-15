import { AfterModelCreateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelCreateParams {
    onAfterModelCreate: Topic<AfterModelCreateTopicParams>;
    context: CmsContext;
}
export const assignAfterModelCreate = (params: AssignAfterModelCreateParams) => {
    const { onAfterModelCreate, context } = params;

    onAfterModelCreate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
