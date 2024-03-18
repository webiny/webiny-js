import { createGenericContext } from "@webiny/app-admin";
import { TrashBinEntryDTO } from "@webiny/app-trash-bin-common";

export interface TrashBinEntryContext {
    entry: TrashBinEntryDTO;
}

const { Provider, useHook } = createGenericContext<TrashBinEntryContext>("TrashBinEntryContext");

export const useTrashBinEntry = useHook;
export const TrashBinEntryProvider = Provider;
