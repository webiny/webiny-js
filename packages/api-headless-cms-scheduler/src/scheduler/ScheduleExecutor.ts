import type { CmsModel } from "@webiny/api-headless-cms/types";
import type {
    IScheduleAction,
    IScheduleExecutor,
    IScheduleFetcher,
    IScheduleRecord,
    ISchedulerInput
} from "~/scheduler/types.js";
import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";
import { convertException } from "@webiny/utils";
import { NotFoundError } from "@webiny/handler-graphql";
import type { ISchedulerService } from "~/service/types.js";
import type { PublishScheduleActionCms } from "~/scheduler/actions/PublishScheduleAction.js";
import type { UnpublishScheduleActionCms } from "~/scheduler/actions/UnpublishScheduleAction.js";
import { WebinyError } from "@webiny/error";

export type ScheduleExecutorCms = UnpublishScheduleActionCms & PublishScheduleActionCms;

export interface IScheduleExecutorParams {
    actions: IScheduleAction[];
    cms: ScheduleExecutorCms;
    scheduleModel: CmsModel;
    service: ISchedulerService;
    fetcher: IScheduleFetcher;
}

export class ScheduleExecutor implements IScheduleExecutor {
    private readonly actions: IScheduleAction[];
    private readonly cms: Pick<ScheduleExecutorCms, "deleteEntry">;
    private readonly scheduleModel: CmsModel;
    private readonly service: Pick<ISchedulerService, "delete">;
    private readonly fetcher: Pick<IScheduleFetcher, "getScheduled">;

    constructor(params: IScheduleExecutorParams) {
        this.actions = params.actions;
        this.cms = params.cms;
        this.scheduleModel = params.scheduleModel;
        this.service = params.service;
        this.fetcher = params.fetcher;
    }

    public async schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        const scheduleRecordId = createScheduleRecordId(targetId);
        const original = await this.fetcher.getScheduled(targetId);
        if (original) {
            return this.reschedule(original, input);
        }

        const action = this.actions.find(action => action.canHandle(input));
        if (!action) {
            throw new WebinyError(
                `No action found for input type "${input.type}".`,
                "NO_ACTION_FOUND",
                {
                    type: input.type
                }
            );
        }

        return await action.schedule({
            scheduleRecordId,
            targetId,
            input
        });
    }

    public async cancel(id: string): Promise<void> {
        const record = await this.fetcher.getScheduled(id);
        if (!record) {
            return;
        }

        try {
            await this.cms.deleteEntry(this.scheduleModel, record.id);
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            console.error(`Error while deleting scheduled record: ${id}.`);
            console.log(convertException(ex));
            throw ex;
        }

        await this.service.delete(record.id);
    }

    private async reschedule(
        original: IScheduleRecord,
        input: ISchedulerInput
    ): Promise<IScheduleRecord> {
        try {
            await this.cms.deleteEntry(this.scheduleModel, original.id);
            await this.service.delete(original.id);
        } catch (ex) {
            console.error(`Failed to clean up existing schedule: ${original.id}`);
            console.log(convertException(ex));
            throw ex;
        }

        return this.schedule(original.targetId, input);
    }
}
