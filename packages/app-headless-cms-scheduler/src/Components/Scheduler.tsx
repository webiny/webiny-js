import React, { useMemo } from "react";
import { SchedulerButton } from "./ScheduleSidebarButton.js";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import type ApolloClient from "apollo-client";

export interface ISchedulerProps {
    app: string;
    client: ApolloClient<object>;
    canPublish: () => boolean;
    canUnpublish: () => boolean;
}

export const Scheduler = (props: ISchedulerProps) => {
    const { app, client, canPublish, canUnpublish } = props;

    const getGateway = useMemo(() => {
        return new SchedulerGetGraphQLGateway(client);
    }, [client]);

    const listGateway = useMemo(() => {
        return new SchedulerListGraphQLGateway(client);
    }, [client]);

    const cancelGateway = useMemo(() => {
        return new SchedulerCancelGraphQLGateway(client);
    }, [client]);

    const publishGateway = useMemo(() => {
        return new SchedulerPublishGraphQLGateway(client);
    }, [client]);

    const unpublishGateway = useMemo(() => {
        return new SchedulerUnpublishGraphQLGateway(client);
    }, [client]);

    if (!canPublish() && !canUnpublish()) {
        return null;
    }

    return (
        <BaseScheduler
            app={app}
            render={({ showScheduler }) => {
                return <SchedulerButton onClick={showScheduler} />;
            }}
            getGateway={getGateway}
            listGateway={listGateway}
            cancelGateway={cancelGateway}
            publishGateway={publishGateway}
            unpublishGateway={unpublishGateway}
        />
    );
};
