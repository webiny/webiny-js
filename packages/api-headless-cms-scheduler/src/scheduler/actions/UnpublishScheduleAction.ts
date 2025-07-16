import type {
    IScheduleAction,
    IScheduleActionScheduleParams,
    IScheduleEntryValues,
    ISchedulerInput
} from "~/scheduler/types.js";
import { createScheduleRecord, transformScheduleEntry } from "~/scheduler/ScheduleRecord.js";
import { convertException } from "@webiny/utils";
import type { CmsIdentity, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type { ISchedulerService } from "~/service/types.js";

export type UnpublishScheduleActionCms = Pick<
    HeadlessCms,
    "getEntryById" | "unpublishEntry" | "createEntry" | "deleteEntry"
>;

export interface IUnpublishScheduleActionParams {
    service: ISchedulerService;
    cms: UnpublishScheduleActionCms;
    targetModel: CmsModel;
    scheduleModel: CmsModel;
    getIdentity: () => CmsIdentity;
}

export class UnpublishScheduleAction implements IScheduleAction {
    private readonly service: ISchedulerService;
    private readonly cms: UnpublishScheduleActionCms;
    private readonly targetModel: CmsModel;
    private readonly scheduleModel: CmsModel;
    private readonly getIdentity: () => CmsIdentity;

    public constructor(params: IUnpublishScheduleActionParams) {
        this.service = params.service;
        this.cms = params.cms;
        this.targetModel = params.targetModel;
        this.scheduleModel = params.scheduleModel;
        this.getIdentity = params.getIdentity;
    }

    public canHandle(input: ISchedulerInput): boolean {
        return input.type === "unpublish";
    }

    public async schedule(params: IScheduleActionScheduleParams) {
        const { targetId, input, scheduleRecordId } = params;

        const targetEntry = await this.cms.getEntryById(this.targetModel, targetId);
        const title = targetEntry.values[this.targetModel.titleFieldId] || "Unknown entry title";
        const identity = this.getIdentity();

        const currentDate = new Date();

        if (input.immediately) {
            const unpublished = await this.cms.unpublishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: unpublished.savedBy,
                scheduledOn: currentDate,
                dateOn: currentDate,
                type: "unpublish",
                title
            });
        } else if (input.dateOn < currentDate) {
            await this.cms.unpublishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: identity,
                scheduledOn: currentDate,
                dateOn: input.dateOn,
                type: "unpublish",
                title
            });
        }

        const scheduleEntry = await this.cms.createEntry<IScheduleEntryValues>(this.scheduleModel, {
            id: scheduleRecordId,
            targetId,
            targetModelId: this.targetModel.modelId,
            title,
            type: "unpublish",
            dateOn: input.dateOn.toISOString(),
            scheduledBy: identity
        });

        try {
            await this.service.create({
                id: scheduleRecordId,
                dateOn: input.dateOn
            });
            return transformScheduleEntry(this.targetModel, scheduleEntry);
        } catch (ex) {
            console.error(
                `Error while creating service event for schedule entry: ${scheduleRecordId}.`
            );
            console.log(convertException(ex));
            try {
                await this.cms.deleteEntry(this.scheduleModel, scheduleRecordId);
            } catch (err) {
                console.error(`Error while deleting schedule entry: ${scheduleRecordId}.`);
                console.log(convertException(err));
            }
            throw ex;
        }
    }
}
