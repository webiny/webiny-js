import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import { createNamespace, formatScheduledDate } from "~/utils/index.js";
import { scheduledActionsStore } from "./ScheduledActionsStore.js";

/**
 * Overrides the CMS "Live" column cell to surface scheduled publish/unpublish actions.
 *
 * When the entry has a scheduled action it renders a "Scheduled" tag with a tooltip stating the
 * action and go-live time; otherwise it falls back to the default "Live (vN)" / "No" rendering.
 */
export const CellLive = observer(() => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { model } = useModel();
    const container = useContainer();

    const namespace = createNamespace(model);

    useEffect(() => {
        const gateway = container.resolve(ListScheduledActionsGateway);
        scheduledActionsStore.load(gateway, namespace);
    }, [container, namespace]);

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    const scheduled = scheduledActionsStore.getAction(namespace, entry.id);

    if (scheduled) {
        const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
        const actionLabel =
            scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";
        const tooltip = goLiveOn
            ? `Scheduled to ${actionLabel} on ${formatScheduledDate(goLiveOn)}`
            : `Scheduled to ${actionLabel}`;

        return (
            <Tooltip
                content={tooltip}
                trigger={<Tag variant={"warning"} icon={<ScheduledIcon />} content={"Scheduled"} />}
            />
        );
    }

    if (!entry.live?.version) {
        return <>No</>;
    }

    return (
        <Tag
            swatchColor={"#5AC84C"}
            variant={"success-light"}
            content={`Live (v${entry.live.version})`}
        />
    );
});
