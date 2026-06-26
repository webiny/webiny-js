import React, { useCallback, useState } from "react";
import { CompositionScope } from "@webiny/react-composition";
import { SchedulerListWithConfig } from "~/presentation/configs/index.js";
import { SchedulerListView } from "./components/SchedulerListView.js";

export interface SchedulerRenderPropParams {
    showScheduler: () => void;
}

interface SchedulerRenderProps {
    (params: SchedulerRenderPropParams): React.ReactNode;
}

export interface SchedulerProps {
    namespace: string;
    render: SchedulerRenderProps;
    onClose?: () => void;
    show?: boolean;
    title?: string;
    canPublish: boolean;
    canUnpublish: boolean;
}

export const Scheduler = ({ render, show: initialShow, ...rest }: SchedulerProps) => {
    const [show, setShow] = useState(initialShow ?? false);

    const showScheduler = useCallback(() => {
        setShow(true);
    }, []);

    const onClose = useCallback(() => {
        if (typeof rest.onClose === "function") {
            rest.onClose();
        }
        setShow(false);
    }, [rest.onClose]);

    return (
        <>
            {show ? (
                <CompositionScope name={"scheduler"}>
                    <SchedulerListWithConfig>
                        <SchedulerListView
                            namespace={rest.namespace}
                            onClose={onClose}
                            title={rest.title ?? "Scheduler"}
                        />
                    </SchedulerListWithConfig>
                </CompositionScope>
            ) : null}
            {render ? render({ showScheduler }) : null}
        </>
    );
};
