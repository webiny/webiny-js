import { OnModelAfterCreateTopicParams, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

interface AssignAfterModelCreateParams {
    onModelAfterCreate: Topic<OnModelAfterCreateTopicParams>;
    context: CmsContext;
}
export const assignModelAfterCreate = (params: AssignAfterModelCreateParams) => {
    const { onModelAfterCreate, context } = params;

    onModelAfterCreate.subscribe(async () => {
        await context.cms.updateModelLastChange();
    });
};
