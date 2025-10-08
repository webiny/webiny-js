import type { Context } from "~/types.js";
import { attachPublishLifecycleEvents } from "~/lifecycleEvents/publish.js";

interface IParams {
    context: Context;
}

export const attachLifecycleEvents = (params: IParams) => {
    attachPublishLifecycleEvents(params);
}
