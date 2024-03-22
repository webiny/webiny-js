import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface IListItemsUseCase {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
