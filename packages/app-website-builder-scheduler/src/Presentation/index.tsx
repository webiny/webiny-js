import React, { useCallback, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { WbSchedulerRenderer } from "~/Presentation/WbSchedulerRenderer/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { WbSchedulerListWithConfig } from "~/Presentation/configs/index.js";
import {
    WbSchedulerCancelGraphQLGateway,
    WbSchedulerGetGraphQLGateway,
    WbSchedulerListGraphQLGateway,
    WbSchedulerPublishGraphQLGateway,
    WbSchedulerUnpublishGraphQLGateway
} from "~/adapters/index.js";

export * from "./components/WbScheduleDialog/index.js";
export * from "~/Presentation/WbSchedulerConfigs/index.js";

/**
 * Decoratable cells.
 */
export * from "./components/Cells/CellScheduledOn/index.js";

export interface WbSchedulerRenderPropParams {
    showScheduler: () => void;
}

interface WbSchedulerRenderProps {
    (params: WbSchedulerRenderPropParams): React.ReactNode;
}

export interface WbSchedulerProps {
    targetId: string;
    render: WbSchedulerRenderProps;
    onClose?: () => void;
    show?: boolean;
    title?: string;
}

export const WbScheduler = ({ render, ...rest }: WbSchedulerProps) => {
    const [show, setShow] = useState(rest.show ?? false);
    const client = useApolloClient();

    const listGateway = useMemo(() => new WbSchedulerListGraphQLGateway(client), [client]);
    const getGateway = useMemo(() => new WbSchedulerGetGraphQLGateway(client), [client]);
    const cancelGateway = useMemo(() => new WbSchedulerCancelGraphQLGateway(client), [client]);
    const publishGateway = useMemo(() => new WbSchedulerPublishGraphQLGateway(client), [client]);
    const unpublishGateway = useMemo(
        () => new WbSchedulerUnpublishGraphQLGateway(client),
        [client]
    );

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
                <CompositionScope name={"wb-scheduler"}>
                    <WbSchedulerListWithConfig>
                        <WbSchedulerRenderer
                            targetId={rest.targetId}
                            getGateway={getGateway}
                            listGateway={listGateway}
                            cancelGateway={cancelGateway}
                            publishGateway={publishGateway}
                            unpublishGateway={unpublishGateway}
                            onClose={onClose}
                            title={rest.title}
                        />
                    </WbSchedulerListWithConfig>
                </CompositionScope>
            )}
            {render ? render({ showScheduler }) : null}
        </>
    );
};
