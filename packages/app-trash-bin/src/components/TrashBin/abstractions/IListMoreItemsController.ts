import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface IListMoreItemsController {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
