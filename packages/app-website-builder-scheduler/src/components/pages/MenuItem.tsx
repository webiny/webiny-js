import React, { useCallback } from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { PageListConfig } from "@webiny/app-website-builder/exports/admin/website-builder/page/list.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { WB_PAGE_NAMESPACE } from "~/utils/namespace.js";

export const PageMenuItem = () => {
    const { page } = PageListConfig.Browser.Page.Action.usePage();
    const { canPublishPage, canUnpublishPage } = usePermissions();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: WB_PAGE_NAMESPACE,
        target: {
            id: page.id,
            title: page.properties.title,
            status: page.status
        }
    });

    const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

    const showDialog = useCallback(() => {
        showSchedulerDialog();
    }, [showSchedulerDialog]);

    if (!canPublishPage && !canUnpublishPage) {
        return null;
    }

    const action = page.status === "published" ? "unpublish" : "publish";

    return (
        <OptionsMenuItem
            icon={<ScheduleIcon />}
            label={`Schedule ${action}`}
            onAction={showDialog}
            data-testid={"wb.page-list.page-action.schedule"}
        />
    );
};
