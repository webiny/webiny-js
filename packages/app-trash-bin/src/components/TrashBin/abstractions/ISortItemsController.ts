import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface ISortItemsController {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
