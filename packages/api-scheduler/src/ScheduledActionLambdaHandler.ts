import { ScheduledActionEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { IScheduledActionEvent } from "@webiny/event-handler-aws/eventTypes/ScheduledActionEventType.js";
import type { IScheduledActionResult } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/index.js";
import type { IExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";

class ScheduledActionLambdaHandlerImpl implements ScheduledActionEventHandler.Interface {
    constructor(private executeScheduledAction: IExecuteScheduledActionUseCase) {}

    async execute(
        eventCtx: EventContext<IScheduledActionEvent>,
        _next: NextFunction
    ): Promise<IScheduledActionResult> {
        const input = eventCtx.event[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        const result = await this.executeScheduledAction.execute(input);

        if (result.isFail()) {
            const error = result.error;
            console.error(error.code, error.message);
            throw error;
        }

        return { success: true };
    }
}

export const ScheduledActionLambdaHandler = ScheduledActionEventHandler.createImplementation({
    implementation: ScheduledActionLambdaHandlerImpl,
    dependencies: [ExecuteScheduledActionUseCase]
});
