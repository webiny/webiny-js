import { SchedulerItem } from "~/Domain";

export interface ISelectedItemsRepository {
    selectItems: (items: SchedulerItem[]) => Promise<void>;
    selectAllItems: () => Promise<void>;
    unselectAllItems: () => Promise<void>;
    getSelectedItems: () => SchedulerItem[];
    getSelectedAllItems: () => boolean;
}
