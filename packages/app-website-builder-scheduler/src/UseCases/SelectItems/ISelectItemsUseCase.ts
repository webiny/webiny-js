import type { WbSchedulerItem } from "~/Domain/index.js";

export interface ISelectItemsUseCase {
    execute: (items: WbSchedulerItem[]) => Promise<void>;
}
