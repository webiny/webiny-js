import { AfterCreateModelTopic, CmsContext } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export interface Params {
    onAfterCreate: Topic<AfterCreateModelTopic>;
    context: CmsContext;
}
export const assignAfterModelCreate = (params: Params) => {
    const { onAfterCreate, context } = params;

    onAfterCreate.subscribe(async () => {
        await context.cms.settings.updateContentModelLastChange();
    });
};
