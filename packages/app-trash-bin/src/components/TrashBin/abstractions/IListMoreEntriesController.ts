import { TrashBinListQueryVariables } from "~/types";

export interface IListMoreEntriesController {
    execute: (params?: TrashBinListQueryVariables) => Promise<void>;
}
