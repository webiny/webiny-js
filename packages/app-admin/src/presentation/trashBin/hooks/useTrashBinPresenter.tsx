import { createGenericContext } from "~/index.js";
import type { ITrashBinViewModel, ITrashBinActions, TrashBinItem } from "../abstractions.js";

export interface TrashBinContext {
    vm: ITrashBinViewModel;
    actions: ITrashBinActions;
    onItemAfterRestore?: (item: TrashBinItem) => Promise<void>;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBinPresenter = useHook;
export const TrashBinProvider = Provider;
