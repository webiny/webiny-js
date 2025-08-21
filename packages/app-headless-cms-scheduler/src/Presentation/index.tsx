import React, { useCallback, useState } from "react";
import { AcoWithConfig } from "@webiny/app-aco";
import { SchedulerRenderer } from "~/Presentation/SchedulerRenderer";
import { CompositionScope } from "@webiny/react-composition";
import { SchedulerListWithConfig } from "~/Presentation/configs";
import type {
    ISchedulerCancelGateway,
    ISchedulerGetGateway,
    ISchedulerListGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

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
    model: Pick<CmsModel, "modelId">;
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
                    <AcoWithConfig>
                        <SchedulerListWithConfig>
                            <SchedulerRenderer {...rest} onClose={onClose} />
                        </SchedulerListWithConfig>
                    </AcoWithConfig>
                </CompositionScope>
            )}
            {render ? render({ showScheduler }) : null}
        </>
    );
};
