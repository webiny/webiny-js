import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { SchedulerFeature } from "./features/feature.js";
import { ScheduleDialogPresenterFeature } from "./presentation/scheduleDialog/feature.js";
import { SchedulerConfigs } from "./presentation/SchedulerConfigs/SchedulerConfigs.js";

export const SchedulerModule = () => {
    return (
        <>
            <RegisterFeature feature={SchedulerFeature} />
            <RegisterFeature feature={ScheduleDialogPresenterFeature} />
            <SchedulerConfigs />
        </>
    );
};

export { useScheduleDialog } from "./presentation/scheduleDialog/useScheduleDialog.js";
export type { IUseScheduleDialogProps } from "./presentation/scheduleDialog/useScheduleDialog.js";
export { Scheduler } from "./presentation/schedulerList/Scheduler.js";
export type { SchedulerProps } from "./presentation/schedulerList/Scheduler.js";
export { SchedulerConfigs } from "./presentation/SchedulerConfigs/SchedulerConfigs.js";
export { SchedulerDialogFormComponentDateTimeInput } from "./presentation/scheduleDialog/useScheduleDialog.js";
export { CellScheduledOn } from "./presentation/components/Cells/CellScheduledOn/index.js";
