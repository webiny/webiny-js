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

export type PublishScheduleActionCms = Pick<
    HeadlessCms,
    "getEntryById" | "publishEntry" | "createEntry" | "updateEntry" | "deleteEntry"
>;

export interface IPublishScheduleActionParams {
    service: ISchedulerService;
    cms: PublishScheduleActionCms;
    targetModel: CmsModel;
    schedulerModel: CmsModel;
    getIdentity: () => CmsIdentity;
    fetcher: IScheduleFetcher;
}

export class PublishScheduleAction implements IScheduleAction {
    private readonly service: ISchedulerService;
    private readonly cms: PublishScheduleActionCms;
    private readonly targetModel: CmsModel;
    private readonly schedulerModel: CmsModel;
    private readonly getIdentity: () => CmsIdentity;
    private readonly fetcher: IScheduleFetcher;

    public constructor(params: IPublishScheduleActionParams) {
        this.service = params.service;
        this.cms = params.cms;
        this.targetModel = params.targetModel;
        this.schedulerModel = params.schedulerModel;
        this.getIdentity = params.getIdentity;
        this.fetcher = params.fetcher;
    }

    public canHandle(input: ISchedulerInput): boolean {
        return input.type === ScheduleType.publish;
    }

    public async schedule(params: IScheduleActionScheduleParams): Promise<IScheduleRecord> {
        const { targetId, input, scheduleRecordId } = params;

        const targetEntry = await this.getTargetEntry(targetId);

        const title = targetEntry.values[this.targetModel.titleFieldId] || "Unknown entry title";
        const identity = this.getIdentity();

        const currentDate = new Date();
        /**
         * Immediately publish the entry if requested.
         * No need to create a schedule entry or the service event.
         */
        if (input.immediately) {
            const publishedEntry = await this.cms.publishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: publishedEntry.savedBy,
                scheduledOn: new Date(publishedEntry.savedOn),
                // dateOn: currentDate,
                type: ScheduleType.publish,
                title
            });
        }
        /**
         * If the entry is scheduled for a date in the past, we need to update it with publish information, if user sent something.
         * No need to create a schedule entry or the service event.
         */
        //
        else if (dateInTheFuture(input.scheduleOn) === false) {
            /**
             * We need to update the entry with publish information because we cannot update it in the publishing process.
             */
            await this.cms.updateEntry(this.targetModel, targetId, {
                firstPublishedBy: identity,
                firstPublishedOn: dateToISOString(input.scheduleOn),
                lastPublishedOn: dateToISOString(input.scheduleOn),
                lastPublishedBy: identity
            });
            const publishedEntry = await this.cms.publishEntry(this.targetModel, targetId);
            return createScheduleRecord({
                id: scheduleRecordId,
                targetId,
                model: this.targetModel,
                scheduledBy: publishedEntry.savedBy,
                scheduledOn: currentDate,
                type: ScheduleType.publish,
                title
            });
        }

        const { id: scheduleEntryId } = parseIdentifier(scheduleRecordId);
        const scheduleEntry = await this.cms.createEntry<IScheduleEntryValues>(
            this.schedulerModel,
            {
                id: scheduleEntryId,
                targetId,
                targetModelId: this.targetModel.modelId,
                title,
                type: ScheduleType.publish,
                scheduledOn: dateToISOString(input.scheduleOn),
                scheduledBy: identity
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
        if (input.immediately || input.scheduleOn < currentDate) {
            await this.cms.publishEntry(this.targetModel, targetEntry.id);
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
                publishOn: currentDate,
                unpublishOn: undefined
                // dateOn: publishedEntry.lastPublishedOn
                //     ? new Date(publishedEntry.lastPublishedOn)
                //     : undefined
            };
        }

        await this.cms.updateEntry<Pick<IScheduleEntryValues, "scheduledOn" | "scheduledBy">>(
            this.schedulerModel,
            original.id,
            {
                scheduledBy: this.getIdentity(),
                scheduledOn: dateToISOString(input.scheduleOn)
            }
        );

        try {
            await this.service.update({
                id: original.id,
                scheduleOn: input.scheduleOn
            });
        } catch (ex) {
            throw ex;
        }
        return {
            ...original,
            publishOn: new Date(),
            unpublishOn: undefined
        };
    }

    public async cancel(id: string): Promise<void> {
        /**
         * No need to do anything if the record does not exist.
         */
        let scheduleEntry: IScheduleRecord | null = null;
        try {
            scheduleEntry = await this.fetcher.getScheduled(id);
            if (!scheduleEntry) {
                return;
            }
        } catch {
            return;
        }

        try {
            await this.cms.deleteEntry(this.schedulerModel, scheduleEntry.id, {
                force: true,
                permanently: true
            });
        } catch (ex) {
            if (ex.code === "NOT_FOUND" || ex instanceof NotFoundError) {
                return;
            }
            console.error(`Error while deleting schedule entry: ${scheduleEntry.id}.`);
            console.log(convertException(ex));
            throw ex;
        }

        try {
            await this.service.delete(scheduleEntry.id);
        } catch (ex) {
            console.error(
                `Error while deleting service event for schedule entry: ${scheduleEntry.id}.`
            );
            console.log(convertException(ex));
            throw ex;
        }
    }

    private async getTargetEntry<T = CmsEntryValues>(id: string): Promise<CmsEntry<T>> {
        return await this.cms.getEntryById<T>(this.targetModel, id);
    }
}
