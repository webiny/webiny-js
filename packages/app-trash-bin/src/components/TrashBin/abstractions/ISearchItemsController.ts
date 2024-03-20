import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface ISearchItemsController {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
