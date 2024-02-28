import { PartialDeep } from "type-fest";
import {
    ISocketsIncomingEvent,
    SocketsEventRequestContextEventType,
    SocketsEventRoute
} from "~/handler/types";

export interface CreateMockEventInput extends PartialDeep<ISocketsIncomingEvent> {
    tenant?: string;
    locale?: string;
    token?: string;
}

export const createMockEvent = (input: CreateMockEventInput = {}): ISocketsIncomingEvent => {
    const { requestContext, body, tenant, locale, token } = input || {};
    return {
        queryStringParameters: {
            tenant: tenant || "root",
            locale: locale || "en-US",
            ...input.queryStringParameters
        },
        requestContext: {
            connectedAt: new Date().getTime(),
            connectionId: "myConnectionId",
            routeKey: SocketsEventRoute.default,
            domainName: "https://webiny.com",
            stage: "dev",
            eventType: SocketsEventRequestContextEventType.message,
            ...requestContext
        },
        body:
            body ||
            JSON.stringify({
                token: token || "aToken",
                tenant: tenant || "root",
                locale: locale || "en-US"
            })
    };
};
