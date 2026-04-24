import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    IScheduledAction,
    ScheduleActionError
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface ISchedulePublishEntryUseCaseParams {
    id: string;
    model: Pick<CmsModel, "modelId">;
    scheduleFor: Date;
}

export interface ISchedulePublishEntryUseCaseResult {
    scheduledAction: IScheduledAction;
}

export type ISchedulePublishEntryUseCaseResponse = Promise<
    Result<ISchedulePublishEntryUseCaseResult, ScheduleActionError>
>;

export interface ISchedulePublishEntryUseCase {
    execute(params: ISchedulePublishEntryUseCaseParams): ISchedulePublishEntryUseCaseResponse;
}

/** Schedule an entry for future publishing. */
export const SchedulePublishEntryUseCase = createAbstraction<ISchedulePublishEntryUseCase>(
    "CmsScheduler/SchedulePublishEntryUseCase"
);

export namespace SchedulePublishEntryUseCase {
    export type Interface = ISchedulePublishEntryUseCase;
    export type Error = ScheduleActionError;
    export type Params = ISchedulePublishEntryUseCaseParams;
    export type Result = ISchedulePublishEntryUseCaseResponse;
}
