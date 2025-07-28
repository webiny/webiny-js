import React, { useEffect } from "react";

export interface IScheduleDialogProps {
    show: boolean;
    children: () => React.ReactNode;
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
