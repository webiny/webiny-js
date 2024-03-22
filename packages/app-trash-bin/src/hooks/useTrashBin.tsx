import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinPresenter, ITrashBinUseControllers } from "~/components/TrashBin/abstractions";

export interface TrashBinContext {
    controllers: ITrashBinUseControllers;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = useHook;
export const TrashBinProvider = Provider;
