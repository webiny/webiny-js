import { createGenericContext } from "@webiny/app-admin";
import { TrashBinItemDTO } from "~/Domain";

export interface TrashBinItemContext {
    item: TrashBinItemDTO;
}

const { Provider, useHook } = createGenericContext<TrashBinItemContext>("TrashBinItemContext");

export const useTrashBinItem = useHook;
export const TrashBinItemProvider = Provider;
