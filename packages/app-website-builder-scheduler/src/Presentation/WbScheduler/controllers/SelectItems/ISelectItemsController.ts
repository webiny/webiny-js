import type { WbSchedulerEntry } from "~/types.js";

export interface ISelectItemsController {
    execute: (items: WbSchedulerEntry[]) => Promise<void>;
}
