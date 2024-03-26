import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinControllers, ITrashBinPresenter } from "~/Presentation/abstractions";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";

export interface TrashBinContext {
    controllers: ITrashBinControllers;
    presenter: ITrashBinPresenter;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = () => {
    const context = useHook();

    return {
        vm: context.presenter.vm,
        deleteItem: (id: string) => context.controllers.deleteItem.execute(id),
        listItems: () => context.controllers.listItems.execute(),
        listMoreItems: () => context.controllers.listMoreItems.execute(),
        searchItems: (query: string) => context.controllers.searchItems.execute(query),
        selectItems: (items: TrashBinItemDTO[]) => context.controllers.selectItems.execute(items),
        sortItems: () => context.controllers.sortItems.execute
    };
};
export const TrashBinProvider = Provider;
