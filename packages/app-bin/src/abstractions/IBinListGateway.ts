import { BinListQueryVariables, BinMetaResponse } from "~/types";

export interface IBinListGateway<TParams extends BinListQueryVariables, TEntry> {
    execute: (params: TParams) => Promise<[TEntry[], BinMetaResponse]>;
}
