import { BinEntry } from "~/domain";
import { BinListQueryVariables, BinMetaResponse } from "~/types";

export interface IBinRepository<TListParams extends BinListQueryVariables> {
    getEntries: () => BinEntry[];
    getMeta: () => BinMetaResponse;
    getLoading: () => boolean;
    listEntries: (params?: TListParams) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
}
