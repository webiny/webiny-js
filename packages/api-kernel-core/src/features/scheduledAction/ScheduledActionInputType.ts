import { InputType } from "~/features/kernel/InputType.js";

import { ScheduledActionInputHandler } from "./ScheduledActionInputHandler.js";

export const SCHEDULED_ACTION_EVENT_IDENTIFIER = "WebinyScheduledAction";

export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
    tenant: string;
}

export interface IScheduledActionEvent {
    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: IScheduledActionEventPayload;
}

class ScheduledActionInputTypeImpl implements InputType.Interface<IScheduledActionEvent> {
    matches(input: any): input is IScheduledActionEvent {
        const value = input?.[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        return !!(value?.id && value?.scheduleFor);
    }

    getHandlerAbstraction() {
        return ScheduledActionInputHandler;
    }
}

export const ScheduledActionInputType = InputType.createImplementation({
    implementation: ScheduledActionInputTypeImpl,
    dependencies: []
});
