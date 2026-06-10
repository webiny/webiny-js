import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useEntry } from "@webiny/app-headless-cms";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { createNamespace } from "~/utils/index.js";

export const MenuItem = observer(() => {
    const { model } = useModel();
    const { entry } = useEntry();

    const { canPublish, canUnpublish } = usePermissions();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: createNamespace({ modelId: model.modelId }),
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
});
