import {
    type IScheduleAction,
    type IScheduleActionScheduleParams,
    type IScheduleEntryValues,
    type IScheduleRecord,
    type ISchedulerInput,
    ScheduleType
} from "~/scheduler/types.js";
import { createScheduleRecord, transformScheduleEntry } from "~/scheduler/ScheduleRecord.js";
import { convertException } from "@webiny/utils";
import type { CmsIdentity, CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types";
import type { ISchedulerService } from "~/service/types.js";
import { dateToISOString } from "~/scheduler/dates.js";
import { NotFoundError } from "@webiny/handler-graphql";

export type UnpublishScheduleActionCms = Pick<
    HeadlessCms,
    "getEntryById" | "unpublishEntry" | "createEntry" | "deleteEntry" | "updateEntry"
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
        return input.type === ScheduleType.unpublish;
    }

    public async schedule(params: IScheduleActionScheduleParams): Promise<IScheduleRecord> {
        const { targetId, input, scheduleRecordId } = params;

        const targetEntry = await this.cms.getEntryById(this.targetModel, targetId);
        const title = targetEntry.values[this.targetModel.titleFieldId] || "Unknown entry title";
        const identity = this.getIdentity();

        const currentDate = new Date();
        /**
         * Immediately unpublish the entry if requested.
         */
        if (input.immediately) {
            const unpublishedEntry = await this.cms.unpublishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: unpublishedEntry.savedBy,
                scheduledOn: currentDate,
                dateOn: currentDate,
                type: ScheduleType.unpublish,
                title
            });
        }
        /**
         * If the entry is scheduled for a date in the past, we need to unpublish it immediately.
         * No need to create a schedule entry or the service event.
         */
        //
        else if (input.scheduleOn < currentDate) {
            await this.cms.unpublishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: identity,
                scheduledOn: input.scheduleOn,
                dateOn: input.dateOn,
                type: ScheduleType.unpublish,
                title
            });
        }
        /**
         * If the entry is scheduled for a future date, we need to create a schedule entry and a service event.
         */
        const scheduleEntry = await this.cms.createEntry<IScheduleEntryValues>(this.scheduleModel, {
            id: scheduleRecordId,
            targetId,
            targetModelId: this.targetModel.modelId,
            title,
            type: ScheduleType.unpublish,
            dateOn: input.dateOn ? dateToISOString(input.dateOn) : undefined,
            scheduledBy: identity,
            scheduledOn: dateToISOString(input.scheduleOn)
        });

        const result = await this.service.create({
            id: scheduleRecordId,
            scheduleOn: input.scheduleOn
        });
        if (result.error) {
            console.error(
                `Could not create service event for schedule entry: ${scheduleRecordId}. Deleting the schedule entry...`
            );
            console.log(convertException(result.error));
            try {
                await this.cms.deleteEntry(this.scheduleModel, scheduleRecordId);
            } catch (err) {
                console.error(`Error while deleting schedule entry: ${scheduleRecordId}.`);
                console.log(convertException(err));
            }
        }
        return transformScheduleEntry(this.targetModel, scheduleEntry);
    }

    public async reschedule(
        original: IScheduleRecord,
        input: ISchedulerInput
    ): Promise<IScheduleRecord> {
        const currentDate = new Date();
        const targetId = original.targetId;
        /**
         * There are two cases when we can immediately publish the entry:
         * 1. If the user requested it.
         * 2. If the entry is scheduled for a date in the past.
         */
        if (input.immediately || input.scheduleOn < currentDate) {
            const publishedEntry = await this.cms.unpublishEntry(this.targetModel, targetId);
            /**
             * We can safely cancel the original schedule entry and the event.
             *
             * // TODO determine if we want to ignore the error of the cancelation.
             */
            try {
                await this.cancel(original.id);
            } catch {
                //
            }

            return {
                ...original,
                publishOn: undefined,
                unpublishOn: currentDate,
                dateOn: publishedEntry.lastPublishedOn
                    ? new Date(publishedEntry.lastPublishedOn)
                    : undefined
            };
        }

        await this.cms.updateEntry<Pick<IScheduleEntryValues, "scheduledOn" | "dateOn">>(
            this.scheduleModel,
            original.id,
            {
                scheduledOn: dateToISOString(input.scheduleOn),
                dateOn: input.dateOn ? dateToISOString(input.dateOn) : undefined
            }
        );

        const result = await this.service.update({
            id: original.id,
            scheduleOn: input.scheduleOn
        });
        if (!result.error) {
            return {
                ...original,
                publishOn: undefined,
                unpublishOn: currentDate,
                dateOn: input.dateOn
            };
        }
        throw result.error;
    }

    public async cancel(id: string): Promise<void> {
        /**
         * No need to do anything if the record does not exist.
         */
        try {
            await this.cms.getEntryById(this.scheduleModel, id);
        } catch {
            return;
        }

        try {
            await this.cms.deleteEntry(this.scheduleModel, id);
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            console.error(`Error while deleting schedule entry: ${id}.`);
            console.log(convertException(ex));
            throw ex;
        }

        const result = await this.service.delete(id);
        if (!result.error) {
            return;
        }
        console.error(`Error while deleting service event for schedule entry: ${id}.`);
        console.log(convertException(result.error));

        throw result.error;
    }
}
