import type { PartialDeep } from "type-fest";
import type { IWebsocketsIncomingEvent } from "~/handler/types";
import { WebsocketsEventRequestContextEventType, WebsocketsEventRoute } from "~/handler/types";

export interface CreateMockEventInput extends PartialDeep<IWebsocketsIncomingEvent> {
    tenant?: string;
    token?: string;
}

export const createMockEvent = (input: CreateMockEventInput = {}): IWebsocketsIncomingEvent => {
    const { requestContext, body, tenant, token } = input || {};
    return {
        queryStringParameters: {
            tenant: tenant || "root",
            ...input.queryStringParameters
        },
        requestContext: {
            connectedAt: new Date().getTime(),
            connectionId: "myConnectionId",
            routeKey: WebsocketsEventRoute.default,
            domainName: "https://webiny.com",
            stage: "dev",
            eventType: WebsocketsEventRequestContextEventType.message,
            ...requestContext
        },
        body:
            body ||
            JSON.stringify({
                token: token || "aToken",
                tenant: tenant || "root"
            })
    };
};
