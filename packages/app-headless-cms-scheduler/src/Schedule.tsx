import React, { useMemo } from "react";
import { useApolloClient, useModel, usePermission } from "@webiny/app-headless-cms/admin/hooks";
import { ScheduleButton } from "~/components/buttons/sidebarButton/ScheduleSidebarButton.js";
import { ScheduleListGraphQLGateway } from "~/graphql/ScheduleListGraphQLGateway.js";
import { ScheduleCancelGraphQLGateway } from "~/graphql/ScheduleCancelGraphQLGateway.js";
import { SchedulePublishGraphQLGateway } from "~/graphql/SchedulePublishGraphQLGateway.js";
import { ScheduleUnpublishGraphQLGateway } from "./graphql/ScheduleUnpublishGraphQLGateway";

export const Schedule = () => {
    const client = useApolloClient();
    const { canPublish, canUnpublish } = usePermission();
    const { model } = useModel();

    const listGateway = useMemo(() => {
        return new ScheduleListGraphQLGateway(client);
    }, [client]);

    const cancelGateway = useMemo(() => {
        return new ScheduleCancelGraphQLGateway(client);
    }, [client]);

    const publishGateway = useMemo(() => {
        return new SchedulePublishGraphQLGateway(client);
    }, [client]);

    const unpublishGateway = useMemo(() => {
        return new ScheduleUnpublishGraphQLGateway(client);
    }, [client]);

    if (!canPublish("cms.contentEntry") && !canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <BaseSchedule
            render={({ showSchedule }) => {
                return <ScheduleButton onClick={showSchedule} />;
            }}
            listGateway={listGateway}
            cancelGateway={cancelGateway}
            publishGateway={publishGateway}
            unpublishGateway={unpublishGateway}
            nameColumnId={model.titleFieldId || "id"}
            title={`Trash - ${model.name}`}
        />
    );
};
