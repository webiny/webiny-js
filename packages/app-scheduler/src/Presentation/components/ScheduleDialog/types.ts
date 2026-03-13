import type { ScheduleActionType } from "~/types.js";

export interface IScheduleDialogScheduledActionExecuteParams {
    targetId: string;
    namespace: string;
    scheduleOn: Date;
    actionType: ScheduleActionType;
}

export interface IScheduleDialogCancelActionExecuteParams {
    id: string;
    namespace: string;
}

export interface IScheduleDialogAction {
    schedule(params: IScheduleDialogScheduledActionExecuteParams): Promise<void>;
    cancel(params: IScheduleDialogCancelActionExecuteParams): Promise<void>;
}
