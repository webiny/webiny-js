import { IBinListGateway, IBinDeleteEntryGateway, IBinEntryMapper } from "~/abstractions";
import { binRepositoryFactory } from "~/domain";
import { BinListQueryVariables } from "~/types";

export const useBinRepository = <
    TListParams extends BinListQueryVariables,
    TEntry extends Record<string, any>
>(
    listGateway: IBinListGateway<TListParams, TEntry>,
    deleteGateway: IBinDeleteEntryGateway,
    entryMapper: IBinEntryMapper<TEntry>,
    namespace: string
) => {
    // @ts-ignore TODO: fix listGateway interface
    return binRepositoryFactory.getRepository(listGateway, deleteGateway, entryMapper, namespace);
};
