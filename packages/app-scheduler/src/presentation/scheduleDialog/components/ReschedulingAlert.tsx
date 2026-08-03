import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { ScheduleActionType } from "~/types.js";
import { scheduleDateFormatter } from "../scheduleDateFormatter.js";

interface IReschedulingAlertProps {
    scheduleOn: Date | undefined;
    actionType: ScheduleActionType | undefined;
}

export const ReschedulingAlert = ({ scheduleOn, actionType }: IReschedulingAlertProps) => {
    if (!scheduleOn || !actionType) {
        return null;
    }
    const actionName = actionType === ScheduleActionType.publish ? "publish" : "unpublish";
    return (
        <Alert type={"warning"} variant={"subtle"} icon={<ScheduledIcon />}>
            <>
                A {actionName} is already scheduled at
                <br />
                <strong>{scheduleDateFormatter.format(scheduleOn)}</strong>.
            </>
        </Alert>
    );
};
