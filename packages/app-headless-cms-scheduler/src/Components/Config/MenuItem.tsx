import React from "react";
import { ContentEntryEditorConfig, useContentEntryEditor } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { usePermission } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@webiny/app-headless-cms";
import { ScheduleDialogAction, useScheduleDialog } from "@webiny/app-scheduler";

export const MenuItem = () => {
    const { entry, loading, contentModel } = useContentEntryEditor();
    const { canPublish, canUnpublish } = usePermission();
    const client = useApolloClient();
    
    const { showDialog: showSchedulerDialog } = useScheduleDialog();
    
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
                app: contentModel.modelId,
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
        <OptionsMenuItem
            icon={<ScheduleIcon />}
            label={`Schedule ${action}`}
            onAction={showDialog}
            disabled={!entry?.meta?.status || loading}
            data-testid={"cms.content-form.header.schedule"}
        />
    );
}
