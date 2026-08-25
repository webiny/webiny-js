import React, { useCallback } from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { usePermissions } from "~/hooks/usePermissions.js";
import { createNamespace } from "~/utils/index.js";
import {
    ContentEntryListConfig,
    useContentEntriesList
} from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms";

export const MenuItem = () => {
    const { modelId } = useContentEntriesList();
    const { entry } = useEntry();

    const { canPublish, canUnpublish } = usePermissions();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: createNamespace({
            modelId
        }),
        target: {
            id: entry.id,
            title: entry.meta.title,
            status: entry.meta.status
        }
    });

    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

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
            disabled={!entry?.meta?.status}
            data-testid={"cms.content-form.header.schedule"}
        />
    );
};
