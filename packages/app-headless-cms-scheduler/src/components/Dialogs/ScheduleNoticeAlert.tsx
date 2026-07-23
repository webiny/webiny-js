import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import { useScheduledActions } from "~/hooks/useScheduledActions.js";
import { formatScheduledDate } from "~/utils/index.js";

interface ScheduleNoticeAlertProps {
    targetId: string | undefined;
    // The action the user is about to take, used in the warning ("Publishing now will cancel it.").
    verb: "Publishing" | "Unpublishing";
}

/**
 * Warns that an about-to-happen publish/unpublish will cancel an existing scheduled action for the
 * entry (the API cancels it). Reads from ScheduledActionsPresenter, already populated by the list
 * (or the entry form). Renders nothing when there is no scheduled action.
 */
export const ScheduleNoticeAlert = observer(({ targetId, verb }: ScheduleNoticeAlertProps) => {
    const presenter = useScheduledActions();

    const scheduled = targetId ? presenter.getScheduledAction(targetId) : undefined;

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
