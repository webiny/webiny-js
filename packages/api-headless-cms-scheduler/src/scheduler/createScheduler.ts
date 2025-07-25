import type { CmsScheduleCallable } from "~/types.js";
import type { ISchedulerService } from "~/service/types.js";
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IScheduler } from "./types.js";
import { Scheduler } from "./Scheduler.js";
import type { ScheduleFetcherCms } from "./ScheduleFetcher.js";
import { ScheduleFetcher } from "./ScheduleFetcher.js";
import type { ScheduleExecutorCms } from "./ScheduleExecutor.js";
import { ScheduleExecutor } from "./ScheduleExecutor.js";
import { PublishScheduleAction } from "~/scheduler/actions/PublishScheduleAction.js";
import { UnpublishScheduleAction } from "~/scheduler/actions/UnpublishScheduleAction.js";

export interface ICreateSchedulerParams {
    security: Pick<CmsContext["security"], "getIdentity">;
    cms: ScheduleExecutorCms & ScheduleFetcherCms;
    service: ISchedulerService;
    scheduleModel: CmsModel;
}

export const createScheduler = async (
    params: ICreateSchedulerParams
): Promise<CmsScheduleCallable> => {
    const { cms, security, scheduleModel, service } = params;

    return (targetModel): IScheduler => {
        const getIdentity = () => {
            const identity = security.getIdentity();
            if (!identity) {
                throw new Error("No identity found in security context.");
            }
            return identity;
        };

        const fetcher = new ScheduleFetcher({
            targetModel,
            scheduleModel,
            cms
        });

        const actions = [
            new PublishScheduleAction({
                cms,
                scheduleModel,
                targetModel,
                service,
                getIdentity,
                fetcher
            }),
            new UnpublishScheduleAction({
                cms,
                scheduleModel,
                targetModel,
                service,
                getIdentity,
                fetcher
            })
        ];

        const executor = new ScheduleExecutor({
            actions,
            fetcher
        });
        return new Scheduler({
            fetcher,
            executor
        });
    };
};
