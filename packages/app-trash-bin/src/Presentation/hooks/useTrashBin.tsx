import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinControllers, ITrashBinPresenter } from "~/Presentation/abstractions";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";

export interface TrashBinContext {
    controllers: ITrashBinControllers;
    presenter: ITrashBinPresenter;
    onItemRestore: (item: TrashBinItemDTO) => Promise<void>;
}

const { Provider, useHook } = createGenericContext<TrashBinContext>("TrashBinContext");

export const useTrashBin = () => {
    const context = useHook();

    return {
        vm: context.presenter.vm,
        onItemRestore: (item: TrashBinItemDTO) => context.onItemRestore(item),
        deleteItem: (id: string) => context.controllers.deleteItem.execute(id),
        restoreItem: (id: string) => context.controllers.restoreItem.execute(id),
        listItems: () => context.controllers.listItems.execute(),
        listMoreItems: () => context.controllers.listMoreItems.execute(),
        searchItems: (query: string) => context.controllers.searchItems.execute(query),
        selectItems: (items: TrashBinItemDTO[]) => context.controllers.selectItems.execute(items),
        sortItems: () => context.controllers.sortItems.execute
    };
};
export const TrashBinProvider = Provider;
