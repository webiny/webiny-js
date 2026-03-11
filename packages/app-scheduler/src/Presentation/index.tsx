import React, { useCallback, useState } from "react";
import { SchedulerRenderer } from "~/Presentation/SchedulerRenderer/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { SchedulerListWithConfig } from "~/Presentation/configs/index.js";
import type {
    ISchedulerCancelGateway,
    ISchedulerGetGateway,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways/index.js";

export * from "./components/ScheduleDialog/index.js";
export * from "~/Presentation/SchedulerConfigs/index.js";

/**
 * Decoratable Cells.
 */
export * from "./components/Cells/CellScheduledOn/index.js";

export interface SchedulerRenderPropParams {
    showScheduler: () => void;
}

interface SchedulerRenderProps {
    (params: SchedulerRenderPropParams): React.ReactNode;
}

export interface SchedulerProps {
    app: string;
    render: SchedulerRenderProps;
    getGateway: ISchedulerGetGateway;
    listGateway: ISchedulerListGateway;
    cancelGateway: ISchedulerCancelGateway;
    publishGateway: ISchedulerPublishGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    onClose?: () => void;
    show?: boolean;
    title?: string;
}

export const Scheduler = ({ render, ...rest }: SchedulerProps) => {
    const [show, setShow] = useState(rest.show ?? false);

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
            {show && (
                <CompositionScope name={"scheduler"}>
                    <SchedulerListWithConfig>
                        <SchedulerRenderer {...rest} onClose={onClose} />
                    </SchedulerListWithConfig>
                </CompositionScope>
            )}
            {render ? render({ showScheduler }) : null}
        </>
    );
};
