import React, { useCallback, useMemo, useState } from "react";
import { SchedulerRenderer } from "~/Presentation/SchedulerRenderer/index.js";
import { CompositionScope } from "@webiny/react-composition";
import { SchedulerListWithConfig } from "~/Presentation/configs/index.js";
import type ApolloClient from "apollo-client";
import { SchedulerGetGraphQLGateway } from "~/Gateways/SchedulerGetGraphQLGateway.js";
import { SchedulerListGraphQLGateway } from "~/Gateways/SchedulerListGraphQLGateway.js";
import { SchedulerCancelGraphQLGateway } from "~/Gateways/SchedulerCancelGraphQLGateway.js";
import { SchedulerPublishGraphQLGateway } from "~/Gateways/SchedulerPublishGraphQLGateway.js";
import { SchedulerUnpublishGraphQLGateway } from "~/Gateways/SchedulerUnpublishGraphQLGateway.js";

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
    client: ApolloClient<object>;
    onClose?: () => void;
    show?: boolean;
    title?: string;
    canPublish: boolean;
    canUnpublish: boolean;
}

export const Scheduler = ({ render, client, show: initialShow, ...rest }: SchedulerProps) => {
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

    const gateways = useMemo(() => {
        return {
            getGateway: new SchedulerGetGraphQLGateway(client),
            listGateway: new SchedulerListGraphQLGateway(client),
            cancelGateway: new SchedulerCancelGraphQLGateway(client),
            publishGateway: new SchedulerPublishGraphQLGateway(client),
            unpublishGateway: new SchedulerUnpublishGraphQLGateway(client)
        };
    }, [client]);

    return (
        <>
            {show ? (
                <CompositionScope name={"scheduler"}>
                    <SchedulerListWithConfig>
                        <SchedulerRenderer
                            {...rest}
                            cancelGateway={gateways.cancelGateway}
                            publishGateway={gateways.publishGateway}
                            unpublishGateway={gateways.unpublishGateway}
                            listGateway={gateways.listGateway}
                            getGateway={gateways.getGateway}
                            onClose={onClose}
                        />
                    </SchedulerListWithConfig>
                </CompositionScope>
            ) : null}
            {render ? render({ showScheduler }) : null}
        </>
    );
};
