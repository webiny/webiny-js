import { TrashBinEntryDTO } from "~/domain";

export interface ITrashBinEntryMapper<TEntry extends Record<string, any>> {
    toDTO: (data: TEntry) => TrashBinEntryDTO;
}
