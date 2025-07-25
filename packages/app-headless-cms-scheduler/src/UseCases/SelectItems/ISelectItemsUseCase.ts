import { SchedulerItem } from "~/Domain";

export interface ISelectItemsUseCase {
    execute: (items: SchedulerItem[]) => Promise<void>;
}
