import type { ScheduledOnType } from "~/scheduler/types.js";
import type {
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

export type ISchedulerServiceCreateResponse = CreateScheduleCommandOutput;

export type ISchedulerServiceUpdateResponse = UpdateScheduleCommandOutput;

export type ISchedulerServiceDeleteResponse = DeleteScheduleCommandOutput;

export interface ISchedulerService {
    create(params: ISchedulerServiceCreateInput): Promise<ISchedulerServiceCreateResponse>;
    update(params: ISchedulerServiceUpdateInput): Promise<ISchedulerServiceUpdateResponse>;
    delete(id: string): Promise<ISchedulerServiceDeleteResponse>;
    exists(id: string): Promise<boolean>;
}
