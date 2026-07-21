import React from "react";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import { formatScheduledDate } from "~/utils/index.js";

const scheduledTooltip = (scheduled: SchedulerEntry): string => {
    const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
    const actionLabel =
        scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";
    return goLiveOn
        ? `Scheduled to ${actionLabel} on ${formatScheduledDate(goLiveOn)}`
        : `Scheduled to ${actionLabel}`;
};

export const ScheduledTag = ({ scheduled }: { scheduled: SchedulerEntry }) => (
    <Tooltip
        content={scheduledTooltip(scheduled)}
        trigger={<Tag variant={"warning"} icon={<ScheduledIcon />} content={"Scheduled"} />}
    />
);
