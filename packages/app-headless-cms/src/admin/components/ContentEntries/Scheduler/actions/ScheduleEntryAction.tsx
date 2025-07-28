import React, { useCallback, useMemo, useState } from "react";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { useApolloClient, usePermission } from "~/admin/hooks/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useGetSchedulerItem } from "./hooks/useGetSchedulerItem.js";
import { ScheduleDialog } from "@webiny/app-headless-cms-scheduler/Presentation/components/ScheduleDialog/ScheduleDialog.js";
import { SchedulerGetGraphQLGateway } from "~/admin/components/ContentEntries/Scheduler/adapters/SchedulerGetGraphQLGateway.js";
import { SchedulerCancelGraphQLGateway } from "~/admin/components/ContentEntries/Scheduler/adapters/SchedulerCancelGraphQLGateway.js";
import { SchedulerPublishGraphQLGateway } from "~/admin/components/ContentEntries/Scheduler/adapters/SchedulerPublishGraphQLGateway.js";
import { SchedulerUnpublishGraphQLGateway } from "~/admin/components/ContentEntries/Scheduler/adapters/SchedulerUnpublishGraphQLGateway.js";

export const ScheduleEntryMenuItem = () => {
    const { entry, loading, ...contentEntry } = useContentEntry();
    const { canPublish, canUnpublish } = usePermission();
    const client = useApolloClient();

    const [show, setShow] = useState(false);

    const getGateway = useMemo(() => {
        return new SchedulerGetGraphQLGateway(client);
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

    const scheduled = useGetSchedulerItem({
        gateway: getGateway,
        id: entry.id,
        modelId: contentEntry.contentModel.modelId
    });

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const toggle = useCallback(() => {
        setShow(!show);
    }, []);

    const scheduleEntry = useMemo(() => {
        if (scheduled.error) {
            console.error(scheduled.error);
            return null;
        }
        return scheduled.item;
    }, [scheduled]);

    if (!canPublish("cms.contentEntry") && !canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <>
            <OptionsMenuItem
                icon={<ScheduleIcon />}
                label={"Schedule entry"}
                onAction={toggle}
                disabled={!entry?.id || loading}
                data-testid={"cms.content-form.header.schedule"}
            />
            <ScheduleDialog
                show={show}
                schedulerEntry={scheduleEntry}
                cancelGateway={cancelGateway}
                publishGateway={publishGateway}
                unpublishGateway={unpublishGateway}
                entry={entry}
            />
        </>
    );
};
