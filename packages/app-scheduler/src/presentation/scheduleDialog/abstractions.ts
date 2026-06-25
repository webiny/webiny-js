import { createAbstraction } from "@webiny/feature/admin";
import type { ScheduleActionType, SchedulerEntry } from "~/types.js";

export interface IScheduleDialogPresenterViewModel {
    loading: boolean;
    entry: SchedulerEntry | null;
}

export interface IScheduleDialogPresenterLoadParams {
    namespace: string;
    id: string;
}

export interface IScheduleDialogPresenterScheduleParams {
    targetId: string;
    namespace: string;
    scheduleOn: Date;
    actionType: ScheduleActionType;
}

export interface IScheduleDialogPresenterCancelParams {
    id: string;
    namespace: string;
}

export interface IScheduleDialogPresenter {
    get vm(): IScheduleDialogPresenterViewModel;
    load(params: IScheduleDialogPresenterLoadParams): Promise<void>;
    schedule(params: IScheduleDialogPresenterScheduleParams): Promise<void>;
    cancel(params: IScheduleDialogPresenterCancelParams): Promise<void>;
    reset(): void;
}

export const ScheduleDialogPresenter = createAbstraction<IScheduleDialogPresenter>(
    "Scheduler/ScheduleDialogPresenter"
);

export namespace ScheduleDialogPresenter {
    export type Interface = IScheduleDialogPresenter;
}
