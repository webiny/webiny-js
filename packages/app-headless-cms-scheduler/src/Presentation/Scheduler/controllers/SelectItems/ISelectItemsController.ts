import type { SchedulerEntry } from "~/types.js";

export interface ISelectItemsController {
    execute: (items: SchedulerEntry[]) => Promise<void>;
}
