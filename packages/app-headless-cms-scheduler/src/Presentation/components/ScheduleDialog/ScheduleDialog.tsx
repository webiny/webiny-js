import React, { useEffect } from "react";
import type { SchedulerEntry } from "~/types.js";

export interface IScheduleDialogProps {
    show: boolean;
    children: () => React.ReactNode;
    schedulerEntry: SchedulerEntry | null;
}

export const ScheduleDialog = ({ show, children }: IScheduleDialogProps) => {
    const [active, setActive] = React.useState(false);

    useEffect(() => {
        setActive(show);
    }, [show]);

    if (!active) {
        return null;
    }

    return <>{children()}</>;
};
