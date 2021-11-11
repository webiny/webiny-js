import { AfterModelUpdateTopic, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterUpdate: Topic<AfterModelUpdateTopic>;
    context: CmsContext;
}
export const assignAfterModelUpdate = (params: Params) => {
    const { onAfterUpdate, context } = params;

    onAfterUpdate.subscribe(async () => {
        await context.cms.settings.updateContentModelLastChange();
    });
};
