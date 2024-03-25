import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectedItemsRepository {
    selectItems: (items: TrashBinItem[]) => Promise<void>;
    getSelectedItems: () => TrashBinItem[];
}
