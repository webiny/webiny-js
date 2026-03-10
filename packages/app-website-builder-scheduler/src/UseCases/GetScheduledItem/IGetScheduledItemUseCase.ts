import type { WbSchedulerItem } from "~/Domain/index.js";

export interface IGetScheduledItemUseCase {
    execute: (id: string) => Promise<WbSchedulerItem | undefined>;
}
