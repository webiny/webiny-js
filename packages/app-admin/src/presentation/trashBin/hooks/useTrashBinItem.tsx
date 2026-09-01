import { createGenericContext } from "~/index.js";
import type { TrashBinItem } from "../abstractions.js";

export interface TrashBinItemContext {
    item: TrashBinItem;
}

const { Provider, useHook } = createGenericContext<TrashBinItemContext>("TrashBinItemContext");

export const useTrashBinItem = useHook;
export const TrashBinItemProvider = Provider;
