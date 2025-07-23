import React, { useMemo } from "react";
import { ScheduleGetGraphQLGateway } from "../adapters/ScheduleGetGraphQLGateway.js";
import { ScheduleListGraphQLGateway } from "../adapters/ScheduleListGraphQLGateway.js";
import { ScheduleCancelGraphQLGateway } from "../adapters/ScheduleCancelGraphQLGateway.js";
import { SchedulePublishGraphQLGateway } from "../adapters/SchedulePublishGraphQLGateway.js";
import { ScheduleUnpublishGraphQLGateway } from "../adapters/ScheduleUnpublishGraphQLGateway.js";
import { useApolloClient, useModel, usePermission } from "~/admin/hooks";
import { SchedulerButton } from "./ScheduleSidebarButton.js";
import { Scheduler as BaseScheduler } from "@webiny/app-headless-cms-scheduler";

export const Scheduler = () => {
    const client = useApolloClient();
    const { canPublish, canUnpublish } = usePermission();
    const { model } = useModel();

    const getGateway = useMemo(() => {
        return new ScheduleGetGraphQLGateway(client, model);
    }, [client, model]);

    const listGateway = useMemo(() => {
        return new ScheduleListGraphQLGateway(client, model);
    }, [client, model]);

    const cancelGateway = useMemo(() => {
        return new ScheduleCancelGraphQLGateway(client, model);
    }, [client, model]);

    const publishGateway = useMemo(() => {
        return new SchedulePublishGraphQLGateway(client, model);
    }, [client, model]);

    const unpublishGateway = useMemo(() => {
        return new ScheduleUnpublishGraphQLGateway(client, model);
    }, [client, model]);

    if (!canPublish("cms.contentEntry") && !canUnpublish("cms.contentEntry")) {
        return null;
    }
    if (Date.now() > new Date("2024-01-01").getTime()) {
        return (
            <SchedulerButton
                onClick={() => {
                    return;
                }}
            />
        );
    }

    return (
        <BaseScheduler
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
