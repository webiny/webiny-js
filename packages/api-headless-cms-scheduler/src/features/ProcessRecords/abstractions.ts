import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduleRecord } from "~/scheduler/types.js";
import { SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";

/**
 * RecordAction Abstraction
 *
 * Handles a specific type of scheduled action (publish, unpublish, etc.)
 */
export interface IRecordAction {
    /**
     * Determines if this action can handle the given schedule record
     */
    canHandle(record: IScheduleRecord): boolean;

    /**
     * Processes the schedule record
     */
    handle(record: IScheduleRecord): Promise<void>;
}

export const RecordAction = createAbstraction<IRecordAction>("RecordAction");

export namespace RecordAction {
    export type Interface = IRecordAction;
}

/**
 * ProcessRecords Abstraction
 *
 * Processes scheduled CMS action events by delegating to appropriate actions
 */
export interface IWebinyScheduledCmsActionEventValues {
    id: string; // id of the schedule record
    scheduleOn: string;
}

export interface IWebinyScheduledCmsActionEvent {
    [SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER]: IWebinyScheduledCmsActionEventValues;
}


export interface IProcessRecords {
    /**
     * Processes a scheduled CMS action event
     */
    execute(payload: IWebinyScheduledCmsActionEvent): Promise<Result<void, Error>>;
}

export const ProcessRecordsUseCase = createAbstraction<IProcessRecords>("ProcessRecordsUseCase");

export namespace ProcessRecordsUseCase {
    export type Interface = IProcessRecords;
    export type Params = IWebinyScheduledCmsActionEvent;
}
