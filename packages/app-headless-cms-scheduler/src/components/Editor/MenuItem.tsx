import React, { useCallback } from "react";
import {
    ContentEntryEditorConfig,
    useContentEntryEditor
} from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { usePermissions } from "~/hooks/usePermissions.js";
import { createNamespace } from "~/utils/index.js";

interface MenuItemWithIdProps {
    entry: ReturnType<typeof useContentEntryEditor>["entry"];
    contentModel: ReturnType<typeof useContentEntryEditor>["contentModel"];
    loading: boolean;
}

/* Rendered only when entry.id exists; hooks that depend on entry.id live here. */
const MenuItemWithId = ({ entry, contentModel, loading }: MenuItemWithIdProps) => {
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

export const MenuItem = () => {
    const { entry, loading, contentModel } = useContentEntryEditor();
    const { canPublish, canUnpublish } = usePermissions();

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    if (!canPublish && !canUnpublish) {
        return null;
    }

    /* When entry.id is missing (e.g. new unsaved entry), render a disabled item
     * without invoking hooks that require a persisted entry. */
    if (!entry.id) {
        return (
            <OptionsMenuItem
                icon={<ScheduleIcon />}
                label={"Schedule"}
                onAction={() => void 0}
                disabled={true}
                data-testid={"cms.content-form.header.schedule"}
            />
        );
    }

    return <MenuItemWithId entry={entry} contentModel={contentModel} loading={loading} />;
};
