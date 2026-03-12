import React, { useCallback } from "react";
import {
    ContentEntryEditorConfig,
    useContentEntryEditor
} from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@webiny/app-headless-cms";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { usePermissions } from "~/hooks/usePermissions.js";
import {createNamespace} from "~/utils/index.js";

export const MenuItem = () => {
    const { entry, loading, contentModel } = useContentEntryEditor();
    const { canPublish, canUnpublish } = usePermissions();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: createNamespace(contentModel),
        target: {
            id: entry.id,
            title: entry.meta.title,
            status: entry.meta.status
        }
    });

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const showDialog = useCallback(() => {
        showSchedulerDialog();
    }, [showSchedulerDialog]);

    if (!canPublish && !canUnpublish) {
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
};
