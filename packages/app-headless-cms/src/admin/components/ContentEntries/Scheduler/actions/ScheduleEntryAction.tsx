import React, { useCallback, useMemo } from "react";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { useApolloClient, usePermission } from "~/admin/hooks/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useGetSchedulerItem } from "./hooks/useGetSchedulerItem.js";
import {
    SchedulerCancelGraphQLGateway,
    SchedulerGetGraphQLGateway,
    SchedulerPublishGraphQLGateway,
    SchedulerUnpublishGraphQLGateway
} from "../adapters/index.js";
import { ScheduleDialogAction, useScheduleDialog } from "@webiny/app-headless-cms-scheduler";

export const ScheduleEntryMenuItem = () => {
    const { entry, loading, contentModel } = useContentEntry();
    const { canPublish, canUnpublish } = usePermission();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog();

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

    const scheduleAction = useMemo(() => {
        return new ScheduleDialogAction({
            cancelGateway,
            publishGateway,
            unpublishGateway
        });
    }, [publishGateway, unpublishGateway]);

    const scheduled = useGetSchedulerItem({
        gateway: getGateway,
        id: entry.id,
        modelId: contentModel.modelId
    });

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const schedulerEntry = useMemo(() => {
        if (scheduled.error) {
            console.error(scheduled.error);
            return null;
        }
        return scheduled.item;
    }, [scheduled]);

    const showDialog = useCallback(() => {
        showSchedulerDialog({
            entry: {
                id: entry.id,
                title: entry.meta.title,
                modelId: contentModel.modelId,
                status: entry.meta.status
            },
            schedulerEntry,
            action: scheduleAction
        });
    }, [entry, schedulerEntry, scheduleAction, showSchedulerDialog, contentModel]);

    if (!canPublish("cms.contentEntry") && !canUnpublish("cms.contentEntry")) {
        return null;
    }

    const action = entry.meta?.status === "published" ? "unpublish" : "publish";

    return (
        <>
            <OptionsMenuItem
                icon={<ScheduleIcon />}
                label={`Schedule ${action}`}
                onAction={showDialog}
                disabled={!entry?.meta?.status || loading}
                data-testid={"cms.content-form.header.schedule"}
            />
        </>
    );
};
