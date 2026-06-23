import { registry } from "@webiny/handler-aws/registry.js";
import type { HandlerFactoryParams } from "@webiny/handler-aws/types.js";
import { createSourceHandler } from "@webiny/handler-aws/sourceHandler.js";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw/index.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/api-scheduler/constants.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";

export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
}

export interface IScheduledActionEvent {
    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: IScheduledActionEventPayload;
}

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const canHandle = (event: Partial<IScheduledActionEvent>): boolean => {
    if (typeof event?.hasOwnProperty !== "function") {
        return false;
    } else if (!event.hasOwnProperty(SCHEDULED_ACTION_EVENT_IDENTIFIER)) {
        return false;
    }

    const value = event[SCHEDULED_ACTION_EVENT_IDENTIFIER];
    return !!(value?.id && value?.scheduleFor);
};

const handler = createSourceHandler<IScheduledActionEvent, HandlerParams>({
    name: "handler-aws-event-bridge-scheduled-cms-action-event",
    canUse: canHandle,
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);

export const createScheduledActionEventHandler = () => {
    return createEventHandler<IScheduledActionEvent>({
        canHandle,
        handle: async params => {
            const { payload, context } = params;
            const input = payload[SCHEDULED_ACTION_EVENT_IDENTIFIER];

            const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);
            const result = await executeScheduledAction.execute(input);

            if (result.isFail()) {
                const error = result.error;
                console.error(error.code, error.message);
                throw error;
            }
            return {
                success: true
            };
        }
    });
};
