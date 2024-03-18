import { TrashBinListQueryVariables, TrashBinMetaResponse } from "~/types";

export interface ITrashBinListGateway<TEntry> {
    execute: (params: TrashBinListQueryVariables) => Promise<[TEntry[], TrashBinMetaResponse]>;
}
