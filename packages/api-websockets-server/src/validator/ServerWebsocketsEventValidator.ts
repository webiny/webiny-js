import { WebinyError } from "@webiny/error";
import { WebsocketsEventValidator, WebsocketsRunner } from "@webiny/api-websockets/exports/api.js";

export class ServerWebsocketsEventValidator implements WebsocketsEventValidator.Interface {
    public async validate<T extends WebsocketsRunner.EventData = WebsocketsRunner.EventData>(
        input: unknown
    ): Promise<WebsocketsRunner.Event<T>> {
        const event = input as WebsocketsRunner.Event<T>;

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
