import { OnModelAfterCreateFromTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelCreateFromParams {
    onModelAfterCreateFrom: Topic<OnModelAfterCreateFromTopicParams>;
    context: CmsContext;
}
export const assignModelAfterCreateFrom = (params: AssignAfterModelCreateFromParams) => {
    const { onModelAfterCreateFrom, context } = params;

    onModelAfterCreateFrom.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
