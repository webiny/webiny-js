import React from "react";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import { useDateFormatter } from "@webiny/app-admin";
import type { DateFormatter } from "@webiny/app-admin";

const scheduledTooltip = (
    scheduled: SchedulerEntry,
    dateFormatter: DateFormatter.Interface
): string => {
    const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
    const actionLabel =
        scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";
    return goLiveOn
        ? `Scheduled to ${actionLabel} on ${dateFormatter.format(goLiveOn)}`
        : `Scheduled to ${actionLabel}`;
};

export const ScheduledTag = ({ scheduled }: { scheduled: SchedulerEntry }) => {
    const dateFormatter = useDateFormatter();
    return (
        <Tooltip
            content={scheduledTooltip(scheduled, dateFormatter)}
            trigger={<Tag variant={"warning"} icon={<ScheduledIcon />} content={"Scheduled"} />}
        />
    );
};
