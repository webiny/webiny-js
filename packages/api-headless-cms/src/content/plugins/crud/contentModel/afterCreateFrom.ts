import { AfterModelCreateFromTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelCreateFromParams {
    onAfterModelCreateFrom: Topic<AfterModelCreateFromTopicParams>;
    context: CmsContext;
}
export const assignAfterModelCreateFrom = (params: AssignAfterModelCreateFromParams) => {
    const { onAfterModelCreateFrom, context } = params;

    onAfterModelCreateFrom.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
