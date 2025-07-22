import { Plugins } from "@webiny/app-admin";
import React from "react";
import { createScheduleModule } from "~/ScheduleModule.js";

export const HeadlessCmsScheduler = () => {
    const Schedule = createScheduleModule();
    return (
        <Plugins>
            <Schedule />
        </Plugins>
    );
};
