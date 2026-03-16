import type { SchedulerItem } from "~/Domain/index.js";

export interface IGetScheduledItemUseCase {
    execute: (id: string) => Promise<SchedulerItem | undefined>;
}
