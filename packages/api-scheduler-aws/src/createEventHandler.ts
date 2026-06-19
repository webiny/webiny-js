import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/api-scheduler/constants.js";

// Legacy plugin-based handler types — kept for downstream compatibility.
export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
}

export interface IScheduledActionEvent {
    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: IScheduledActionEventPayload;
}
