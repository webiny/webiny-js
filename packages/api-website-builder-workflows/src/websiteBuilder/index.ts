import type { Context } from "~/types.js";
import { attachUpdatePageLifecycleEvents } from "./updatePage.js";
import { attachDeletePageLifecycleEvents } from "./deletePage.js";
import { attachPublishPageLifecycleEvents } from "./publishPage.js";

interface IParams {
    context: Pick<Context, "workflowState" | "websiteBuilder">;
}

export const attachLifecycleEvents = (params: IParams) => {
    attachUpdatePageLifecycleEvents(params);
    attachDeletePageLifecycleEvents(params);
    attachPublishPageLifecycleEvents(params);
};
