import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import { formatScheduledDate } from "~/utils/index.js";
import { scheduledActionsStore } from "../Browser/ScheduledActionsStore.js";

interface ScheduleNoticeAlertProps {
    targetId: string | undefined;
    // The action the user is about to take, used in the warning ("Publishing now will cancel it.").
    verb: "Publishing" | "Unpublishing";
}

/**
 * Warns that an about-to-happen publish/unpublish will cancel an existing scheduled action for the
 * entry (the API cancels it). Reads from the store the Live column already populated, so no model
 * context or extra request is needed. Renders nothing when there is no scheduled action.
 */
export const ScheduleNoticeAlert = observer(({ targetId, verb }: ScheduleNoticeAlertProps) => {
    const scheduled = targetId ? scheduledActionsStore.getActionByTargetId(targetId) : undefined;

    if (!scheduled) {
        return null;
    }

    const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
    const actionLabel =
        scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";

    return (
        <Alert type={"warning"} variant={"subtle"} className={"mb-md"}>
            This entry has a {actionLabel} scheduled
            {goLiveOn ? ` for ${formatScheduledDate(goLiveOn)}` : ""}. {verb} now will cancel it.
        </Alert>
    );
});
