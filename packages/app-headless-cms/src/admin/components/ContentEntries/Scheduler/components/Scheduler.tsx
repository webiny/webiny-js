import React, { useMemo } from "react";
import { SchedulerGetGraphQLGateway } from "../adapters/SchedulerGetGraphQLGateway.js";
import { SchedulerListGraphQLGateway } from "../adapters/SchedulerListGraphQLGateway.js";
import { SchedulerCancelGraphQLGateway } from "../adapters/SchedulerCancelGraphQLGateway.js";
import { SchedulerPublishGraphQLGateway } from "../adapters/SchedulerPublishGraphQLGateway.js";
import { SchedulerUnpublishGraphQLGateway } from "../adapters/SchedulerUnpublishGraphQLGateway.js";
import { useApolloClient, useModel, usePermission } from "~/admin/hooks";
import { SchedulerButton } from "./ScheduleSidebarButton.js";
import { Scheduler as BaseScheduler } from "@webiny/app-headless-cms-scheduler/index.js";

export const Scheduler = () => {
    const client = useApolloClient();
    const { canPublish, canUnpublish } = usePermission();
    const { model } = useModel();

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

    if (!canPublish("cms.contentEntry") && !canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <BaseScheduler
            model={model}
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
