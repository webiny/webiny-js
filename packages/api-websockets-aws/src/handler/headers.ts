import type { IWebsocketsEventData } from "@webiny/api-websockets";
import type { IAwsWebsocketsIncomingEvent } from "~/handler/types.js";

const getEventBody = (event: IAwsWebsocketsIncomingEvent): IWebsocketsEventData => {
    if (!event.body) {
        return {};
    } else if (typeof event.body === "object") {
        return event.body;
    } else if (typeof event.body === "string") {
        try {
            return JSON.parse(event.body);
        } catch (ex) {
            console.log(ex.message);
            return {};
        }
    }
    console.log("Unexpected event.body type:", typeof event.body);
    return {};
};

const getToken = (
    body: IWebsocketsEventData,
    event: IAwsWebsocketsIncomingEvent
): string | null => {
    return body?.token || event.queryStringParameters?.token || null;
};

const getTenant = (body: IWebsocketsEventData, event: IAwsWebsocketsIncomingEvent): string => {
    return body?.tenant || event.queryStringParameters?.tenant || "root";
};

export const getEventValues = (event: IAwsWebsocketsIncomingEvent) => {
    const body = getEventBody(event);

    const token = getToken(body, event);
    const tenant = getTenant(body, event);
    return {
        tenant,
        token,
        endpoint: "manage"
    };
};
