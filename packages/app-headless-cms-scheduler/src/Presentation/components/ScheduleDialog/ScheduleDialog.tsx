import React, { useEffect } from "react";
import type { SchedulerEntry } from "~/types.js";
import type {
    ISchedulerCancelGateway,
    ISchedulerPublishGateway,
    ISchedulerUnpublishGateway
} from "~/Gateways/index.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

export interface IScheduleDialogProps {
    show: boolean;
    schedulerEntry: SchedulerEntry | null;
    cancelGateway: ISchedulerCancelGateway;
    publishGateway: ISchedulerPublishGateway;
    unpublishGateway: ISchedulerUnpublishGateway;
    entry: CmsContentEntry;
}

export const ScheduleDialog = ({ show }: IScheduleDialogProps) => {
    const [active, setActive] = React.useState(false);

    useEffect(() => {
        setActive(show);
    }, [show]);

    if (!active) {
        return null;
    }

    return <>test</>;
};
