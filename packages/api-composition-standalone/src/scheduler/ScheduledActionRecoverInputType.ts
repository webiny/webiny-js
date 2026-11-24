import { InputType } from "@webiny/api-kernel-core";

import { ScheduledActionRecoverInputHandler } from "./ScheduledActionRecoverInputHandler.js";

export const SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER = "WebinyScheduledActionRecover";

/**
 * Asks the scheduler to re-arm the root tenant's pending scheduled actions. Dispatched once at
 * boot: the scheduler keeps its timers in memory, so a restart loses every schedule that has not fired yet.
 */
export interface IScheduledActionRecoverEvent {
    [SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER]: true;
}

class ScheduledActionRecoverInputTypeImpl implements InputType.Interface<IScheduledActionRecoverEvent> {
    matches(input: any): input is IScheduledActionRecoverEvent {
        return input?.[SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return ScheduledActionRecoverInputHandler;
    }
}

export const ScheduledActionRecoverInputType = InputType.createImplementation({
    implementation: ScheduledActionRecoverInputTypeImpl,
    dependencies: []
});
