import React, { useCallback } from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import {
    PageEditorConfig,
    useDocumentEditor
} from "@webiny/app-website-builder/exports/admin/website-builder/page/editor.js";
import { Icon } from "@webiny/admin-ui";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { WB_PAGE_NAMESPACE } from "~/utils/namespace.js";

const { DropdownAction } = PageEditorConfig.Ui.TopBar;

export const PageEditorScheduleMenuItem = () => {
    const documentEditor = useDocumentEditor();
    const state = documentEditor.getDocumentState().toJson();
    // @ts-expect-error status is not defined in the document interface, but we know it is there
    const status = (state.status || "draft") as string;

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        namespace: WB_PAGE_NAMESPACE,
        target: {
            id: state.id,
            title: state.properties.title || "unknown",
            status
        }
    });

    const showDialog = useCallback(() => {
        showSchedulerDialog();
    }, [showSchedulerDialog]);

    return (
        <DropdownAction.MenuItem
            label={"Schedule"}
            icon={<Icon label={"Schedule"} icon={<ScheduleIcon />} />}
            onAction={showDialog}
            disabled={!status}
            data-testid={"wb.editor.header.schedule"}
        />
    );
};
