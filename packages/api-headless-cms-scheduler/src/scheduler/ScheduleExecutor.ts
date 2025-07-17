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

        if (original) {
            return action.reschedule(original, input);
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

        const result = await this.service.delete(record.id);
        if (!result.error) {
            return;
        } else if (result.error.code === "NOT_FOUND" || result.error instanceof NotFoundError) {
            return;
        }
        throw result.error;
    }
}
