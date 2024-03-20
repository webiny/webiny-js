import { TrashBinListQueryVariables, TrashBinMetaResponse } from "~/types";

export interface ITrashBinListGateway<TItem> {
    execute: (params: TrashBinListQueryVariables) => Promise<[TItem[], TrashBinMetaResponse]>;
}
