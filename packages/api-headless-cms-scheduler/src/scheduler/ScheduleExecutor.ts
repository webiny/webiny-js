import {
    type IScheduleAction,
    type IScheduleExecutor,
    type IScheduleFetcher,
    type IScheduleRecord,
    type ISchedulerInput,
    ScheduleType
} from "~/scheduler/types.js";
import { createScheduleRecordIdWithVersion } from "~/scheduler/createScheduleRecordId.js";
import type { PublishScheduleActionCms } from "~/scheduler/actions/PublishScheduleAction.js";
import type { UnpublishScheduleActionCms } from "~/scheduler/actions/UnpublishScheduleAction.js";
import { WebinyError } from "@webiny/error";

export type ScheduleExecutorCms = UnpublishScheduleActionCms & PublishScheduleActionCms;

export interface IScheduleExecutorParams {
    actions: IScheduleAction[];
    fetcher: IScheduleFetcher;
}

export class ScheduleExecutor implements IScheduleExecutor {
    private readonly actions: IScheduleAction[];
    private readonly fetcher: Pick<IScheduleFetcher, "getScheduled">;

    constructor(params: IScheduleExecutorParams) {
        this.actions = params.actions;
        this.fetcher = params.fetcher;
    }

    public async schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        const scheduleRecordId = createScheduleRecordIdWithVersion(targetId);
        const original = await this.fetcher.getScheduled(targetId);

        const action = this.getAction(input.type);

        if (original) {
            return action.reschedule(original, input);
        }

        return await action.schedule({
            scheduleRecordId,
            targetId,
            input
        });
    }

    public async cancel(initialId: string): Promise<IScheduleRecord> {
        const id = createScheduleRecordIdWithVersion(initialId);
        const original = await this.fetcher.getScheduled(id);
        if (!original) {
            throw new WebinyError(
                `No scheduled record found for ID "${id}".`,
                "SCHEDULED_RECORD_NOT_FOUND",
                {
                    id
                }
            );
        }

        const action = this.getAction(original.type);
        await action.cancel(original.id);
        return original;
    }

    private getAction(type: ScheduleType): IScheduleAction {
        const action = this.actions.find(action => {
            return action.canHandle({
                type
            });
        });
        if (action) {
            return action;
        }
        throw new WebinyError(`No action found for input type "${type}".`, "NO_ACTION_FOUND", {
            type
        });
    }
}
