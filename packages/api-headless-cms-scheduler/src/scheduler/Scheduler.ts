import type {
    IScheduleExecutor,
    IScheduleFetcher,
    IScheduler,
    IScheduleRecord,
    ISchedulerInput,
    ISchedulerListParams,
    ISchedulerListResponse
} from "~/scheduler/types.js";

export interface ISchedulerParams {
    fetcher: IScheduleFetcher;
    executor: IScheduleExecutor;
}

export class Scheduler implements IScheduler {
    private readonly fetcher: IScheduleFetcher;
    private readonly executor: IScheduleExecutor;

    public constructor(params: ISchedulerParams) {
        this.fetcher = params.fetcher;
        this.executor = params.executor;
    }

    public async getScheduled(targetId: string): Promise<IScheduleRecord | null> {
        return this.fetcher.getScheduled(targetId);
    }

    public async listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse> {
        return this.fetcher.listScheduled(params);
    }

    public async schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        return this.executor.schedule(targetId, input);
    }

    public async cancel(id: string): Promise<IScheduleRecord> {
        return this.executor.cancel(id);
    }
}
