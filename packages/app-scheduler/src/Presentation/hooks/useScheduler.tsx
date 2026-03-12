import { useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { createGenericContext } from "@webiny/app-admin";
import type {
    ISchedulerControllers,
    ISchedulerPresenter
} from "~/Presentation/abstractions/index.js";
import type { SchedulerEntry } from "~/types.js";

export interface SchedulerContext {
    controllers: ISchedulerControllers;
    presenter: ISchedulerPresenter;
}

const { Provider, useHook } = createGenericContext<SchedulerContext>("SchedulerContext");

export const useScheduler = () => {
    const context = useHook();
    const [vm, setVm] = useState(context.presenter.vm);

    useEffect(() => {
        return autorun(() => {
            const newState = context.presenter.vm;
            setVm(newState);
        });
    }, [context.presenter]);

    const cancelItem = useCallback(
        (id: string) => context.controllers.scheduleCancelItem.execute(id),
        [context.controllers.scheduleCancelItem]
    );

    const publishItem = useCallback(
        (id: string, scheduleOn: Date) =>
            context.controllers.schedulePublishItem.execute(id, scheduleOn),
        [context.controllers.schedulePublishItem]
    );

    const unpublishItem = useCallback(
        (id: string, scheduleOn: Date) =>
            context.controllers.scheduleUnpublishItem.execute(id, scheduleOn),
        [context.controllers.scheduleUnpublishItem]
    );

    const listItems = useCallback(
        () => context.controllers.listItems.execute(),
        [context.controllers.listItems]
    );
    const getItem = useCallback(
        (id: string) => {
            return context.controllers.getItem.execute({
                id
            });
        },
        [context.controllers.getItem]
    );

    const listMoreItems = useCallback(
        () => context.controllers.listMoreItems.execute(),
        [context.controllers.listMoreItems]
    );

    const selectItems = useCallback(
        (items: SchedulerEntry[]) => context.controllers.selectItems.execute(items),
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

    const searchItems = useCallback(
        (value: string) => {
            return context.controllers.searchItems.execute(value);
        },
        [context.controllers.searchItems]
    );

    return {
        vm,
        cancelItem,
        publishItem,
        unpublishItem,
        getItem,
        listItems,
        listMoreItems,
        selectItems,
        selectAllItems,
        unselectAllItems,
        sortItems,
        searchItems
    };
};

export const SchedulerProvider = Provider;
