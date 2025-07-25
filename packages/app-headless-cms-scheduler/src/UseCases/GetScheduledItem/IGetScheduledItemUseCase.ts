import { SchedulerItem } from "~/Domain";

export interface IGetScheduledItemUseCase {
    execute: (id: string) => Promise<SchedulerItem | undefined>;
}
