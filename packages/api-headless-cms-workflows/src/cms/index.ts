import type { Context } from "~/types.js";
// import { attachCreateEntryLifecycleEvents } from "./createEntry.js";
import { attachPublishEntryLifecycleEvents } from "./publishEntry.js";
import { attachDeleteEntryLifecycleEvents } from "./deleteEntry.js";
import { attachDeleteModelLifecycleEvents } from "./deleteModel.js";

interface IParams {
    context: Context;
}

export const attachCmsLifecycleEvents = (params: IParams) => {
    // attachCreateEntryLifecycleEvents(params);
    attachPublishEntryLifecycleEvents(params);
    attachDeleteEntryLifecycleEvents(params);
    attachDeleteModelLifecycleEvents(params);
};
