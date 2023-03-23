import React from "react";
import { ScheduleActionDialogProvider } from "./useScheduleActionDialog";
import { ScheduleActionDialog } from "./ScheduleActionDialog";
import { ChangeContentStatusDialog } from "./ChangeContentStatusDialog";
import { ChangeContentStatusButton } from "./ChangeContentStatusButton";

export const ChangeContentStatus: React.VFC = () => {
    return (
        <ScheduleActionDialogProvider>
            <ScheduleActionDialog />
            <ChangeContentStatusDialog />
            <ChangeContentStatusButton />
        </ScheduleActionDialogProvider>
    );
};
