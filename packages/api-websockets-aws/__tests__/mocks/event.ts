import type { PartialDeep } from "type-fest";
import type {
    IAwsWebsocketsIncomingEvent,
    IAwsWebsocketsEventRequestContext,
    WebsocketsEventRoute,
    WebsocketsEventRequestContextEventType
} from "~/handler/types";

export interface CreateMockEventInput extends PartialDeep<IAwsWebsocketsIncomingEvent> {
    tenant?: string;
    token?: string;
}

export const createMockEvent = (input: CreateMockEventInput = {}): IAwsWebsocketsIncomingEvent => {
    const { requestContext, body, tenant, token } = input || {};
    return {
        queryStringParameters: {
            tenant: tenant || "root",
            ...input.queryStringParameters
        },
        requestContext: {
            connectedAt: new Date().getTime(),
            connectionId: "myConnectionId",
            routeKey: "$default" as WebsocketsEventRoute,
            domainName: "webiny.com",
            stage: "dev",
            eventType: "MESSAGE" as WebsocketsEventRequestContextEventType,
            ...(requestContext as IAwsWebsocketsEventRequestContext)
        },
        body:
            body ||
            JSON.stringify({
                token: token || "aToken",
                tenant: tenant || "root"
            })
    };
};
