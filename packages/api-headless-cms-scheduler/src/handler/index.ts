import { registry } from "@webiny/handler-aws/registry.js";
import type { HandlerFactoryParams } from "@webiny/handler-aws/types.js";
import { createSourceHandler } from "@webiny/handler-aws/sourceHandler.js";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw/index.js";
import { SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import type { IWebinyScheduledCmsActionEvent } from "./Handler.js";
import { Handler } from "./Handler.js";
import type { ScheduleContext } from "~/types.js";
import { PublishHandlerAction } from "./actions/PublishHandlerAction.js";
import { UnpublishHandlerAction } from "./actions/UnpublishHandlerAction.js";

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const canHandle = (event: Partial<IWebinyScheduledCmsActionEvent>): boolean => {
    if (typeof event?.hasOwnProperty !== "function") {
        return false;
    } else if (!event.hasOwnProperty(SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER)) {
        return false;
    }

    const value = event[SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER];
    return !!(value?.id && value?.scheduleOn);
};

const handler = createSourceHandler<IWebinyScheduledCmsActionEvent, HandlerParams>({
    name: "handler-aws-event-bridge-scheduled-cms-action-event",
    canUse: event => {
        return canHandle(event);
    },
    handle: async ({ params, event, context }) => {
        return createHandler(params)(event, context);
    }
});

registry.register(handler);

export const createScheduledCmsActionEventHandler = () => {
    return createEventHandler<IWebinyScheduledCmsActionEvent, ScheduleContext>({
        canHandle: event => {
            return canHandle(event);
        },
        handle: async params => {
            const { payload, context } = params;

            const handler = new Handler({
                actions: [
                    new PublishHandlerAction({
                        cms: context.cms
                    }),
                    new UnpublishHandlerAction({
                        cms: context.cms
                    })
                ]
            });

            return handler.handle({
                payload,
                cms: context.cms,
                security: context.security
            });
        }
    });
};
