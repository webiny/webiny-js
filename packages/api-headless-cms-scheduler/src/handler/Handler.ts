import { WebinyError } from "@webiny/error/index";
import { SCHEDULE_MODEL_ID, SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { IHandlerAction } from "~/handler/types.js";
import type { IScheduleEntryValues } from "~/scheduler/types.js";
import type { ScheduleContext } from "~/types.js";

export interface IHandlerParams {
    actions: IHandlerAction[];
}

export interface IHandlerHandleParams {
    payload: IWebinyScheduledCmsActionEvent;
    cms: Pick<ScheduleContext["cms"], "scheduler" | "getEntryManager" | "getModel">;
    security: Pick<ScheduleContext["security"], "setIdentity">;
}

export interface IWebinyScheduledCmsActionEventValues {
    id: string; // id of the schedule record
    scheduleOn: string;
}

export interface IWebinyScheduledCmsActionEvent {
    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: IWebinyScheduledCmsActionEventValues;
}

export class Handler {
    private readonly actions: IHandlerAction[];

    public constructor(params: IHandlerParams) {
        this.actions = params.actions;
    }
    public async handle(params: IHandlerHandleParams): Promise<void> {
        const { payload, cms, security } = params;

        const values = payload[SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER];
        const scheduleEntryManager = await cms.getEntryManager<IScheduleEntryValues>(
            SCHEDULE_MODEL_ID
        );
        /**
         * Just fetch the schedule entry so we know the model it is targeting.
         */
        const scheduleEntry = await scheduleEntryManager.get(values.id);

        const targetModel = await cms.getModel(scheduleEntry.values.targetModelId);
        /**
         * We want a formatted schedule record to be used later.
         */
        const scheduler = cms.scheduler(targetModel);
        const scheduleRecord = await scheduler.getScheduled(values.id);
        /**
         * Should not happen as we fetched it a few lines up, just in different format.
         */
        if (!scheduleRecord) {
            throw new WebinyError(
                `No schedule record found for ID: ${values.id}`,
                "SCHEDULE_RECORD_NOT_FOUND",
                values
            );
        }

        const action = this.actions.find(action => action.canHandle(scheduleRecord));
        if (!action) {
            await scheduleEntryManager.update(values.id, {
                error: `No action found for schedule record ID.`
            });
            throw new WebinyError(
                `No action found for schedule record ID: ${values.id}`,
                "NO_ACTION_FOUND",
                scheduleRecord
            );
        }
        /**
         * We want to mock the identity of the user that scheduled this record.
         */
        security.setIdentity(scheduleRecord.scheduledBy);

        try {
            await action.handle(scheduleRecord);
        } catch (ex) {
            console.error(`Error while handling schedule record ID: ${values.id}`);
            await scheduleEntryManager.update(values.id, {
                error: ex.message
            });
            throw ex;
        }
        /**
         * Everything is ok. Delete the schedule record.
         */
        await scheduleEntryManager.delete(values.id);
    }
}
