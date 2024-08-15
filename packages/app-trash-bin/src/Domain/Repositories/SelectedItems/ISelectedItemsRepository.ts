import { TrashBinItem } from "~/Domain";

export interface ISelectedItemsRepository {
    selectItems: (items: TrashBinItem[]) => Promise<void>;
    selectAllItems: () => Promise<void>;
    unselectAllItems: () => Promise<void>;
    getSelectedItems: () => TrashBinItem[];
    getSelectedAllItems: () => boolean;
}
