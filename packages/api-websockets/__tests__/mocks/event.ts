import type { PartialDeep } from "type-fest";
import type {
    IWebsocketsEvent,
    IWebsocketsEventContext,
    IWebsocketsEventData
} from "~/types";

export interface CreateMockEventInput extends PartialDeep<IWebsocketsEvent> {
    tenant?: string;
    token?: string;
}

export const createMockEvent = (input: CreateMockEventInput = {}): IWebsocketsEvent => {
    const { context, body, tenant, token } = input || {};
    return {
        context: {
            connectionId: "myConnectionId",
            connectedAt: new Date().getTime(),
            host: "webiny.com",
            eventType: "message",
            route: "default",
            endpoint: "https://webiny.com/dev",
            ...(context as IWebsocketsEventContext)
        },
        body: (body as IWebsocketsEventData) || {
            token: token || "aToken",
            tenant: tenant || "root"
        }
    };
};
