import { InputType } from "~/features/events/InputType.js";
import type { IInputType } from "~/features/events/InputType.js";
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

class ScheduledActionInputTypeImpl implements IInputType<IScheduledActionEvent> {
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
