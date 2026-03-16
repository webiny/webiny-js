import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/schedule.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IScheduleUnpublishEntryUseCaseParams {
    id: string;
    model: Pick<CmsModel, "modelId">;
    scheduleFor: Date;
}

export interface IScheduleUnpublishEntryUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type IScheduleUnpublishEntryUseCaseResponse = Promise<
    Result<IScheduleUnpublishEntryUseCaseResult, ScheduleActionError>
>;

export interface IScheduleUnpublishEntryUseCase {
    execute(params: IScheduleUnpublishEntryUseCaseParams): IScheduleUnpublishEntryUseCaseResponse;
}

export const ScheduleUnpublishEntryUseCase = createAbstraction<IScheduleUnpublishEntryUseCase>(
    "CmsScheduler/ScheduleUnpublishEntryUseCase"
);

export namespace ScheduleUnpublishEntryUseCase {
    export type Interface = IScheduleUnpublishEntryUseCase;
    export type Error = ScheduleActionError;
    export type Params = IScheduleUnpublishEntryUseCaseParams;
    export type Result = IScheduleUnpublishEntryUseCaseResponse;
}
