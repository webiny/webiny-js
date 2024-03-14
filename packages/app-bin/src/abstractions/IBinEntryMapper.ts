import { BinEntryDTO } from "~/domain";

export interface IBinEntryMapper<TEntry extends Record<string, any>> {
    toDTO: (data: TEntry) => BinEntryDTO;
}
