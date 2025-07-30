import type { ScheduleType } from "~/types";

export interface IScheduleDialogScheduleActionExecuteParams {
    id: string;
    modelId: string;
    scheduleOn: Date;
    type: ScheduleType;
}

export interface IScheduleDialogCancelActionExecuteParams {
    id: string;
    modelId: string;
}

export interface IScheduleDialogAction {
    schedule(params: IScheduleDialogScheduleActionExecuteParams): Promise<void>;
    cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void>;
}
