import { createGenericContext } from "@webiny/app-admin";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";

export interface TrashBinItemContext {
    item: TrashBinItemDTO;
}

const { Provider, useHook } = createGenericContext<TrashBinItemContext>("TrashBinItemContext");

export const useTrashBinItem = useHook;
export const TrashBinItemProvider = Provider;
