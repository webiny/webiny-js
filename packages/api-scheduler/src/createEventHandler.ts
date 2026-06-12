import { registry } from "@webiny/handler-aws/registry.js";
import type { HandlerFactoryParams } from "@webiny/handler-aws/types.js";
import { createSourceHandler } from "@webiny/handler-aws/sourceHandler.js";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw/index.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";

export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
    tenant: string;
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

            const tenantContext = context.container.resolve(TenantContext);
            /**
             * Use default tenant if tenant is not provided in the payload.
             * This allows backward compatibility with existing scheduled actions that do not have tenant information in their payload.
             */
            if (!input.tenant) {
                input.tenant = tenantContext.getTenant().id;
            }
            const getTenantByIdUseCase = context.container.resolve(GetTenantByIdUseCase);
            const tenantResult = await getTenantByIdUseCase.execute(input.tenant);
            if (tenantResult.isFail()) {
                throw tenantResult.error;
            }
            const tenant = tenantResult.value;

            return tenantContext.withTenant(tenant, async () => {
                const executeScheduledAction = context.container.resolve(
                    ExecuteScheduledActionUseCase
                );
                const result = await executeScheduledAction.execute(input);

                if (result.isFail()) {
                    const error = result.error;
                    console.error(error.code, error.message);
                    throw error;
                }
                return {
                    success: true
                };
            });
        }
    });
};
