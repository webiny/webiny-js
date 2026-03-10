import type { WbSchedulerItem } from "~/Domain/index.js";

export interface ISelectedItemsRepository {
    selectItems: (items: WbSchedulerItem[]) => Promise<void>;
    selectAllItems: () => Promise<void>;
    unselectAllItems: () => Promise<void>;
    getSelectedItems: () => WbSchedulerItem[];
    getSelectedAllItems: () => boolean;
}
