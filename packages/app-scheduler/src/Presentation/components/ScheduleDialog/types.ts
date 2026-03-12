import type { ScheduleType } from "~/types.js";

export interface IScheduleDialogScheduleActionExecuteParams {
    id: string;
    namespace: string;
    scheduleOn: Date;
    type: ScheduleType;
}

export interface IScheduleDialogCancelActionExecuteParams {
    id: string;
    namespace: string;
}

export interface IScheduleDialogAction {
    schedule(params: IScheduleDialogScheduleActionExecuteParams): Promise<void>;
    cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void>;
}
