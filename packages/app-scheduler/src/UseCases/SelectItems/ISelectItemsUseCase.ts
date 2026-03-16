import type { SchedulerItem } from "~/Domain/index.js";

export interface ISelectItemsUseCase {
    execute: (items: SchedulerItem[]) => Promise<void>;
}
