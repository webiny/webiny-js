import { useEffect, useMemo, useState, useCallback } from "react";
import { autorun } from "mobx";
import { createGenericContext } from "@webiny/app-admin";
import { ITrashBinControllers, ITrashBinPresenter } from "~/Presentation/abstractions";
import { TrashBinItemDTO } from "~/Domain";
import { TrashBinBulkActionsParams } from "~/types";

export interface TrashBinContext {
    controllers: ITrashBinControllers;
    presenter: ITrashBinPresenter;
    onItemAfterRestore: (item: TrashBinItemDTO) => Promise<void>;
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

    const onItemAfterRestore = useCallback(
        (item: TrashBinItemDTO) => context.onItemAfterRestore(item),
        [context.onItemAfterRestore]
    );

    const deleteItem = useCallback(
        (id: string) => context.controllers.deleteItem.execute(id),
        [context.controllers.deleteItem]
    );

    const restoreItem = useCallback(
        (id: string) => context.controllers.restoreItem.execute(id),
        [context.controllers.restoreItem]
    );

    const bulkAction = useCallback(
        (params: TrashBinBulkActionsParams) => context.controllers.bulkAction.execute(params),
        [context.controllers.bulkAction]
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

    const selectAllItems = useCallback(
        () => context.controllers.selectAllItems.execute(),
        [context.controllers.selectAllItems]
    );

    const unselectAllItems = useCallback(
        () => context.controllers.unselectAllItems.execute(),
        [context.controllers.unselectAllItems]
    );

    const sortItems = useMemo(
        () => context.controllers.sortItems.execute,
        [context.controllers.sortItems]
    );

    const getRestoredItemById = useCallback(
        (id: string) => context.controllers.getRestoredItemById.execute(id),
        [context.controllers.getRestoredItemById]
    );

    return {
        vm,
        onItemAfterRestore,
        deleteItem,
        restoreItem,
        bulkAction,
        listItems,
        listMoreItems,
        searchItems,
        selectItems,
        selectAllItems,
        unselectAllItems,
        sortItems,
        getRestoredItemById
    };
};

export const TrashBinProvider = Provider;
