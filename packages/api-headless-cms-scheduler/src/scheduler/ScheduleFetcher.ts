import type { CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type {
    IScheduleEntryValues,
    IScheduleFetcher,
    IScheduleRecord,
    ISchedulerListParams,
    ISchedulerListResponse
} from "~/scheduler/types.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";
import { transformScheduleEntry } from "~/scheduler/ScheduleRecord.js";
import { convertException } from "@webiny/utils";

export type ScheduleFetcherCms = Pick<HeadlessCms, "getEntryById" | "listEntries">;

export interface IScheduleFetcherParams {
    cms: ScheduleFetcherCms;
    targetModel: CmsModel;
    scheduleModel: CmsModel;
}

export class ScheduleFetcher implements IScheduleFetcher {
    private readonly cms: ScheduleFetcherCms;
    private readonly targetModel: CmsModel;
    private readonly scheduleModel: CmsModel;

    constructor(params: IScheduleFetcherParams) {
        this.cms = params.cms;
        this.scheduleModel = params.scheduleModel;
        this.targetModel = params.targetModel;
    }

    public async getScheduled(targetId: string): Promise<IScheduleRecord | null> {
        try {
            const scheduleRecordId = createScheduleRecordId(targetId);
            const entry = await this.cms.getEntryById<IScheduleEntryValues>(
                this.scheduleModel,
                scheduleRecordId
            );
            return transformScheduleEntry(this.targetModel, entry);
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return null;
            }
            console.error(`Error while fetching scheduled record: ${targetId}.`);
            console.log(convertException(ex));
            throw ex;
        }
    }

    public async listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse> {
        const result = await this.cms.listEntries<IScheduleEntryValues>(this.scheduleModel, {
            sort: params.sort,
            limit: params.limit,
            where: params.where,
            after: params.after
        });

        return {
            data: result[0].map(item => transformScheduleEntry(this.targetModel, item)),
            meta: result[1]
        };
    }
}
