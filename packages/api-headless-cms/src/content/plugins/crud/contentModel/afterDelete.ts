import { AfterModelDeleteTopic, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterDelete: Topic<AfterModelDeleteTopic>;
    context: CmsContext;
}
export const assignAfterModelDelete = (params: Params) => {
    const { onAfterDelete, context } = params;

    onAfterDelete.subscribe(async () => {
        await context.cms.settings.updateContentModelLastChange();
    });
};
