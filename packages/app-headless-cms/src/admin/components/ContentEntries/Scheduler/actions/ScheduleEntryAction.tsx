import React, { useCallback, useState } from "react";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";
import { usePermission } from "~/admin/hooks/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useGetSchedulerItem } from "./hooks/useGetSchedulerItem.js";
import { ScheduleDialog } from "@webiny/app-headless-cms-scheduler/Presentation/components/ScheduleDialog/ScheduleDialog.js";

export const ScheduleEntryMenuItem = () => {
    const { entry, loading, ...contentEntry } = useContentEntry();
    const { canPublish, canUnpublish } = usePermission();

    const [show, setShow] = useState(false);

    const scheduled = useGetSchedulerItem({
        id: entry.id,
        modelId: contentEntry.contentModel.modelId
    });

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const toggle = useCallback(() => {
        setShow(!show);
    }, []);

    const scheduleEntry = useCallback(() => {
        // TODO
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
            <ScheduleDialog show={show}>
                {() => {
                    return <>a</>;
                }}
            </ScheduleDialog>
        </>
    );
};
