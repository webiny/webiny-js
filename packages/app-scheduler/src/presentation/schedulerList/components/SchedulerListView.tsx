import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer } from "@webiny/app";
import { SchedulerListPresenterFeature } from "../feature.js";
import { useSchedulerListPresenter } from "../useSchedulerListPresenter.js";
import { ListScheduledActionsFeature } from "~/features/listScheduledActions/feature.js";
import { CancelScheduledActionFeature } from "~/features/cancelScheduledAction/feature.js";
import { SchedulerOverlay } from "./SchedulerOverlay.js";

interface SchedulerListViewProps {
    namespace: string;
    onClose: () => void;
    title: string;
}

const SchedulerListViewInner = observer(function SchedulerListViewInner(
    props: SchedulerListViewProps
) {
    const presenter = useSchedulerListPresenter();

    useEffect(() => {
        presenter.init({ namespace: props.namespace });
    }, [presenter, props.namespace]);

    return (
        <SchedulerOverlay presenter={presenter} onExited={props.onClose} title={props.title} />
    );
});

export const SchedulerListView = (props: SchedulerListViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListScheduledActionsFeature.register(child);
        CancelScheduledActionFeature.register(child);
        SchedulerListPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <SchedulerListViewInner {...props} />
        </DiContainerProvider>
    );
};
