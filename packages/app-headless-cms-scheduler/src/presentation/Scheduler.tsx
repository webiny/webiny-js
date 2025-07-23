import React from "react";
import type { IScheduleGetGraphQLGateway } from "~/gateways/ScheduleGetGraphQLGateway.js";
import type { IScheduleListGraphQLGateway } from "~/gateways/ScheduleListGraphQLGateway.js";
import type { IScheduleCancelGraphQLGateway } from "~/gateways/ScheduleCancelGraphQLGateway.js";
import type { ISchedulePublishGraphQLGateway } from "~/gateways/SchedulePublishGraphQLGateway.js";
import type { IScheduleUnpublishGraphQLGateway } from "~/gateways/ScheduleUnpublishGraphQLGateway.js";

export interface ISchedulerPropsRenderCallable {
    showScheduler: () => void;
}

export interface ISchedulerPropsRender {
    (cb: ISchedulerPropsRenderCallable): void;
}

export interface ISchedulerProps {
    render: ISchedulerPropsRender;
    getGateway: IScheduleGetGraphQLGateway;
    listGateway: IScheduleListGraphQLGateway;
    cancelGateway: IScheduleCancelGraphQLGateway;
    publishGateway: ISchedulePublishGraphQLGateway;
    unpublishGateway: IScheduleUnpublishGraphQLGateway;
}

export const Scheduler = (props: ISchedulerProps) => {
    return <>{"Doing other stuff"}</>;
};
