import {
    ITrashBinListGateway,
    ITrashBinDeleteEntryGateway,
    ITrashBinEntryMapper
} from "~/abstractions";
import { trashBinRepositoryFactory } from "~/domain";

export const useTrashBinRepository = <TEntry extends Record<string, any>>(
    listGateway: ITrashBinListGateway<TEntry>,
    deleteGateway: ITrashBinDeleteEntryGateway,
    entryMapper: ITrashBinEntryMapper<TEntry>,
    namespace: string
) => {
    return trashBinRepositoryFactory.getRepository(
        listGateway,
        deleteGateway,
        // @ts-ignore TODO: fix entryMapper interface
        entryMapper,
        namespace
    );
};
