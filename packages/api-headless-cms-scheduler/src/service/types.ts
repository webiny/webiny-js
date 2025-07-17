import type { ScheduledOnType } from "~/scheduler/types.js";
import { WebinyError } from "@webiny/error";
import {
    CreateScheduleCommandOutput,
    DeleteScheduleCommandOutput,
    UpdateScheduleCommandOutput
} from "@webiny/aws-sdk/client-scheduler";

export interface ISchedulerServiceCreateInput {
    id: string;
    scheduleOn: ScheduledOnType;
}

export interface ISchedulerServiceUpdateInput {
    id: string;
    scheduleOn: ScheduledOnType;
}

export interface ISchedulerServiceCancelSuccessResponse {
    data: CreateScheduleCommandOutput;
    error?: never;
}

export interface ISchedulerServiceCancelErrorResponse {
    error: WebinyError;
    data?: never;
}

export type ISchedulerServiceCreateResponse =
    | ISchedulerServiceCancelErrorResponse
    | ISchedulerServiceCancelSuccessResponse;

export interface ISchedulerServiceUpdateSuccessResponse {
    data: UpdateScheduleCommandOutput;
    error?: never;
}

export interface ISchedulerServiceUpdateErrorResponse {
    error: WebinyError;
    data?: never;
}

export type ISchedulerServiceUpdateResponse =
    | ISchedulerServiceUpdateErrorResponse
    | ISchedulerServiceUpdateSuccessResponse;

export interface ISchedulerServiceDeleteSuccessResponse {
    data: DeleteScheduleCommandOutput;
    error?: never;
}

export interface ISchedulerServiceDeleteErrorResponse {
    error: WebinyError;
    data?: never;
}

export type ISchedulerServiceDeleteResponse =
    | ISchedulerServiceDeleteErrorResponse
    | ISchedulerServiceDeleteSuccessResponse;

export interface ISchedulerService {
    create(params: ISchedulerServiceCreateInput): Promise<ISchedulerServiceCreateResponse>;
    update(params: ISchedulerServiceUpdateInput): Promise<ISchedulerServiceUpdateResponse>;
    delete(id: string): Promise<ISchedulerServiceDeleteResponse>;
    exists(id: string): Promise<boolean>;
}
