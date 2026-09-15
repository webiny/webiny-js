import React from "react";
import { DatePicker } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/react-composition";
import type { BindComponentRenderProp } from "@webiny/form";

export interface ISchedulerDialogFormComponentDateTimeInputProps {
    bind: BindComponentRenderProp<Date>;
}

export const SchedulerDialogFormComponentDateTimeInput = makeDecoratable(
    "SchedulerDialogFormComponentDateTimeInput",
    (props: ISchedulerDialogFormComponentDateTimeInputProps) => {
        const { bind } = props;

        return <DatePicker {...bind} type={"dateTimeLocal"} label={"Schedule On"} size={"lg"} />;
    }
);
