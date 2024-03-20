import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinPresenter } from "@webiny/app-trash-bin-common";
import { ITrashBinControllers } from "~/components/TrashBin/abstractions";

export interface TrashBinContext {
    controllers: ITrashBinControllers;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = useHook;
export const TrashBinProvider = Provider;
