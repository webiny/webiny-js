import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export interface IListMoreEntriesController {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
