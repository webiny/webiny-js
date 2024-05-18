import { TrashBinItem } from "~/Domain";

export interface ISelectedItemsRepository {
    selectItems: (items: TrashBinItem[]) => Promise<void>;
    getSelectedItems: () => TrashBinItem[];
}
