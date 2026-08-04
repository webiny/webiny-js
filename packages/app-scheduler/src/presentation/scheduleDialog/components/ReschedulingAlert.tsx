import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import type { IScheduleDialogRescheduling } from "../abstractions.js";

interface IReschedulingAlertProps {
    rescheduling: IScheduleDialogRescheduling | null;
}

export const ReschedulingAlert = ({ rescheduling }: IReschedulingAlertProps) => {
    if (!rescheduling) {
        return null;
    }
    return (
        <Alert type={"warning"} variant={"subtle"} icon={<ScheduledIcon />}>
            <>
                A {rescheduling.actionName} is already scheduled at
                <br />
                <strong>{rescheduling.scheduleOn}</strong>.
            </>
        </Alert>
    );
};
