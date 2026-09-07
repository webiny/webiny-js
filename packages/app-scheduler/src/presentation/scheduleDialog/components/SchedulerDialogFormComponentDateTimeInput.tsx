import React, { useMemo } from "react";
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

        const timezone = useMemo(() => {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }, []);

        return (
            <DatePicker
                {...bind}
                type={"dateTimeLocal"}
                label={"Schedule On"}
                description={`Timezone: ${timezone}`}
                size={"lg"}
            />
        );
    }
);
