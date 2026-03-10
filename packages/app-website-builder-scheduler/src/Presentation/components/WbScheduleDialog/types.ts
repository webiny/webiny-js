import type { ScheduleType } from "~/types.js";

export interface IWbScheduleDialogScheduleActionExecuteParams {
    id: string;
    scheduleOn: Date;
    type: ScheduleType;
}

export interface IWbScheduleDialogCancelActionExecuteParams {
    id: string;
}

export interface IWbScheduleDialogAction {
    schedule(params: IWbScheduleDialogScheduleActionExecuteParams): Promise<void>;
    cancel(params: IWbScheduleDialogCancelActionExecuteParams): Promise<void>;
}
