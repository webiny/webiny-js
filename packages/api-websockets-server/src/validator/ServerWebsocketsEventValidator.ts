import { WebinyError } from "@webiny/error";
import type { IWebsocketsEventValidator } from "@webiny/api-websockets";
import type { IWebsocketsEvent } from "@webiny/api-websockets";
import type { IWebsocketsEventData } from "@webiny/api-websockets";

export class ServerWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>> {
        const event = input as IWebsocketsEvent<T>;

        if (event.context.eventType === "message" && !event.body) {
            throw new WebinyError("Message event must have a body.", "VALIDATION_FAILED_NO_BODY");
        }

        /* Use body.action as custom route if provided. */
        if (event.context.eventType === "message" && event.body?.action) {
            event.context.route = event.body.action;
        }

        return event;
    }
}
