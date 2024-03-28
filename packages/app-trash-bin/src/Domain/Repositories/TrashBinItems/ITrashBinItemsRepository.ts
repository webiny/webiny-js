import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { Meta } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface ITrashBinItemsRepository {
    listItems: (params?: TrashBinListQueryVariables) => Promise<void>;
    listMoreItems: () => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    getItems: () => TrashBinItem[];
    getMeta: () => Meta;
    getLoading: () => Record<string, any>;
}
