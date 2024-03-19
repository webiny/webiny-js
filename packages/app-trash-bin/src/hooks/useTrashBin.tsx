import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinController, ITrashBinPresenter } from "@webiny/app-trash-bin-common";

export interface TrashBinContext {
    controllers: ITrashBinController;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = useHook;
export const TrashBinProvider = Provider;
