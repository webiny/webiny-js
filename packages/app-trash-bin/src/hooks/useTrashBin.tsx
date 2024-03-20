import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinControllers, ITrashBinPresenter } from "~/components/TrashBin/abstractions";

export interface TrashBinContext {
    controllers: ITrashBinControllers;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = useHook;
export const TrashBinProvider = Provider;
