import type { ScheduleType } from "~/types.js";

export interface IScheduleDialogScheduleActionExecuteParams {
    id: string;
    app: string;
    scheduleOn: Date;
    type: ScheduleType;
}

export interface IScheduleDialogCancelActionExecuteParams {
    id: string;
    app: string;
}

export interface IScheduleDialogAction {
    schedule(params: IScheduleDialogScheduleActionExecuteParams): Promise<void>;
    cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void>;
}
