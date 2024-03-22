import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface IListMoreItemsUseCase {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
