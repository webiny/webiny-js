import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinUseCases, ITrashBinPresenter } from "~/components/TrashBin/abstractions";

export interface TrashBinContext {
    useCases: ITrashBinUseCases;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = useHook;
export const TrashBinProvider = Provider;
