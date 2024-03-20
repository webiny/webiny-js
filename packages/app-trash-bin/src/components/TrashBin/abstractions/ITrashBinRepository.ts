import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface ITrashBinRepository {
    init: (params?: TrashBinListQueryVariables) => Promise<void>;
    listItems: (override: boolean, params?: TrashBinListQueryVariables) => Promise<void>;
    selectItems: (items: TrashBinItem[]) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    getSelectedItems: () => TrashBinItem[];
    getItems: () => TrashBinItem[];
}
