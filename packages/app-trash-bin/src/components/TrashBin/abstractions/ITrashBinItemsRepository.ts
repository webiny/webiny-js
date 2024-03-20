import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface ITrashBinItemsRepository {
    init: (params?: TrashBinListQueryVariables) => Promise<void>;
    listItems: (override: boolean, params?: TrashBinListQueryVariables) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    getItems: () => TrashBinItem[];
}
