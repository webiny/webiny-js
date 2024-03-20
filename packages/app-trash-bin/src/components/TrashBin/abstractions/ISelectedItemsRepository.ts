import { TrashBinItem } from "@webiny/app-trash-bin-common";

export interface ISelectedItemsRepository {
    init: () => Promise<void>;
    selectItems: (items: TrashBinItem[]) => Promise<void>;
    getSelectedItems: () => TrashBinItem[];
}
