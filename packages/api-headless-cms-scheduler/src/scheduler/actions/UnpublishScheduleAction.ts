import type {
    IScheduleAction,
    IScheduleActionScheduleParams,
    IScheduleEntryValues,
    IScheduleFetcher,
    IScheduleRecord,
    ISchedulerInput
} from "~/scheduler/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import { createScheduleRecord, transformScheduleEntry } from "~/scheduler/ScheduleRecord.js";
import { convertException } from "@webiny/utils";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsIdentity,
    CmsModel,
    HeadlessCms
} from "@webiny/api-headless-cms/types";
import type { ISchedulerService } from "~/service/types.js";
import { dateToISOString } from "~/scheduler/dates.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { dateInTheFuture } from "~/utils/dateInTheFuture.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";

export type UnpublishScheduleActionCms = Pick<
    HeadlessCms,
    "getEntryById" | "unpublishEntry" | "createEntry" | "deleteEntry" | "updateEntry"
>;

export interface IUnpublishScheduleActionParams {
    service: ISchedulerService;
    cms: UnpublishScheduleActionCms;
    targetModel: CmsModel;
    schedulerModel: CmsModel;
    getIdentity: () => CmsIdentity;
    fetcher: IScheduleFetcher;
}

export class UnpublishScheduleAction implements IScheduleAction {
    private readonly service: ISchedulerService;
    private readonly cms: UnpublishScheduleActionCms;
    private readonly targetModel: CmsModel;
    private readonly schedulerModel: CmsModel;
    private readonly getIdentity: () => CmsIdentity;
    private readonly fetcher: IScheduleFetcher;

    public constructor(params: IUnpublishScheduleActionParams) {
        this.service = params.service;
        this.cms = params.cms;
        this.targetModel = params.targetModel;
        this.schedulerModel = params.schedulerModel;
        this.getIdentity = params.getIdentity;
        this.fetcher = params.fetcher;
    }

    public canHandle(input: ISchedulerInput): boolean {
        return input.type === ScheduleType.unpublish;
    }

    public async schedule(params: IScheduleActionScheduleParams): Promise<IScheduleRecord> {
        const { targetId, input, scheduleRecordId } = params;

        const targetEntry = await this.getTargetEntry(targetId);
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
                // dateOn: currentDate,
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
                // dateOn: input.dateOn,
                type: ScheduleType.unpublish,
                title
            });
        }
        /**
         * If the entry is scheduled for a future date, we need to create a schedule entry and a service event.
         */

        const { id: scheduleEntryId } = parseIdentifier(scheduleRecordId);
        const scheduleEntry = await this.cms.createEntry<IScheduleEntryValues>(
            this.schedulerModel,
            {
                id: scheduleEntryId,
                targetId,
                targetModelId: this.targetModel.modelId,
                title,
                type: ScheduleType.unpublish,
                // dateOn: input.dateOn ? dateToISOString(input.dateOn) : undefined,
                scheduledBy: identity,
                scheduledOn: dateToISOString(input.scheduleOn)
            }
        );

        try {
            await this.service.create({
                id: scheduleRecordId,
                scheduleOn: input.scheduleOn
            });
        } catch (ex) {
            console.error(
                `Could not create service event for schedule entry: ${scheduleRecordId}. Deleting the schedule entry...`
            );
            console.log(convertException(ex));
            try {
                await this.cms.deleteEntry(this.schedulerModel, scheduleRecordId, {
                    force: true,
                    permanently: true
                });
            } catch (err) {
                console.error(`Error while deleting schedule entry: ${scheduleRecordId}.`);
                console.log(convertException(err));
                throw err;
            }
            throw ex;
        }

        return transformScheduleEntry(this.targetModel, scheduleEntry);
    }

    public async reschedule(
        original: IScheduleRecord,
        input: ISchedulerInput
    ): Promise<IScheduleRecord> {
        const currentDate = new Date();
        const targetId = original.targetId;

        const targetEntry = await this.getTargetEntry(targetId);
        /**
         * There are two cases when we can immediately publish the entry:
         * 1. If the user requested it.
         * 2. If the entry is scheduled for a date in the past.
         */
        if (input.immediately || dateInTheFuture(input.scheduleOn)) {
            await this.cms.unpublishEntry(this.targetModel, targetEntry.id);
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
                unpublishOn: currentDate
                // dateOn: publishedEntry.lastPublishedOn
                //     ? new Date(publishedEntry.lastPublishedOn)
                //     : undefined
            };
        }

        await this.cms.updateEntry<Pick<IScheduleEntryValues, "scheduledOn">>(
            this.schedulerModel,
            original.id,
            {
                scheduledOn: dateToISOString(input.scheduleOn)
                // dateOn: input.dateOn ? dateToISOString(input.dateOn) : undefined
            }
        );

        try {
            await this.service.update({
                id: original.id,
                scheduleOn: input.scheduleOn
            });
        } catch (ex) {
            console.error(`Could not update service event for schedule entry: ${original.id}.`);
            console.log(convertException(ex));
            throw ex;
        }

        return {
            ...original,
            publishOn: undefined,
            unpublishOn: currentDate
            // dateOn: input.dateOn
        };
    }

    public async cancel(id: string): Promise<void> {
        /**
         * No need to do anything if the record does not exist.
         */
        let scheduleRecord: IScheduleRecord | null = null;
        try {
            scheduleRecord = await this.fetcher.getScheduled(id);
            if (!scheduleRecord) {
                return;
            }
        } catch {
            return;
        }

        try {
            await this.cms.deleteEntry(this.schedulerModel, scheduleRecord.id, {
                force: true,
                permanently: true
            });
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            console.error(`Error while deleting schedule entry: ${scheduleRecord.id}.`);
            console.log(convertException(ex));
            throw ex;
        }

        try {
            await this.service.delete(scheduleRecord.id);
        } catch (ex) {
            console.error(
                `Error while deleting service event for schedule entry: ${scheduleRecord.id}.`
            );
            console.log(convertException(ex));

            throw ex;
        }
    }

    private async getTargetEntry<T = CmsEntryValues>(id: string): Promise<CmsEntry<T>> {
        return await this.cms.getEntryById<T>(this.targetModel, id);
    }
}
