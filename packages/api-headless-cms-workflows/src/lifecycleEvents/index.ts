import type { Context } from "~/types.js";
import { attachPublishLifecycleEvents } from "./publish.js";
import { attachCreateLifecycleEvents } from "./create.js";
import { attachDeleteLifecycleEvents } from "./delete.js";

interface IParams {
    context: Context;
}

export const attachLifecycleEvents = (params: IParams) => {
    attachCreateLifecycleEvents(params);
    attachPublishLifecycleEvents(params);
    attachDeleteLifecycleEvents(params);
};
