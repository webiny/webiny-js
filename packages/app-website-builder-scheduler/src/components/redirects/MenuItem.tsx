import React, { useCallback } from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { RedirectListConfig } from "@webiny/app-website-builder/exports/admin/website-builder/redirect/list.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { WB_REDIRECT_NAMESPACE } from "~/utils/namespace.js";

export const RedirectMenuItem = () => {
    const { redirect } = RedirectListConfig.Browser.Redirect.Action.useRedirect();
    const { canWriteRedirect } = usePermissions();
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: WB_REDIRECT_NAMESPACE,
        target: {
            id: redirect.id,
            title: redirect.title,
            status: redirect.isEnabled ? "published" : "unpublished"
        }
    });

    const { OptionsMenuItem } = RedirectListConfig.Browser.Redirect.Action;

    const showDialog = useCallback(() => {
        showSchedulerDialog();
    }, [showSchedulerDialog]);

    if (!canWriteRedirect) {
        return null;
    }

    const action = redirect.isEnabled ? "disable" : "enable";

    return (
        <OptionsMenuItem
            icon={<ScheduleIcon />}
            label={`Schedule ${action}`}
            onAction={showDialog}
            data-testid={"wb.redirect-list.redirect-action.schedule"}
        />
    );
};
