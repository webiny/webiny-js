import { useEffect, useMemo, useState, useCallback } from "react";
import { autorun } from "mobx";
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
    const [vm, setVm] = useState(context.presenter.vm);

    useEffect(() => {
        return autorun(() => {
            const newState = context.presenter.vm;
            setVm(newState);
        });
    }, [context.presenter]);

    const onItemRestore = useCallback(
        (item: TrashBinItemDTO) => context.onItemRestore(item),
        [context.onItemRestore]
    );

    const deleteItem = useCallback(
        (id: string) => context.controllers.deleteItem.execute(id),
        [context.controllers.deleteItem]
    );

    const restoreItem = useCallback(
        (id: string) => context.controllers.restoreItem.execute(id),
        [context.controllers.restoreItem]
    );

    const listItems = useCallback(
        () => context.controllers.listItems.execute(),
        [context.controllers.listItems]
    );

    const listMoreItems = useCallback(
        () => context.controllers.listMoreItems.execute(),
        [context.controllers.listMoreItems]
    );

    const searchItems = useCallback(
        (query: string) => context.controllers.searchItems.execute(query),
        [context.controllers.searchItems]
    );

    const selectItems = useCallback(
        (items: TrashBinItemDTO[]) => context.controllers.selectItems.execute(items),
        [context.controllers.selectItems]
    );

    const sortItems = useMemo(
        () => context.controllers.sortItems.execute,
        [context.controllers.sortItems]
    );

    return {
        vm,
        onItemRestore,
        deleteItem,
        restoreItem,
        listItems,
        listMoreItems,
        searchItems,
        selectItems,
        sortItems
    };
};

export const TrashBinProvider = Provider;
