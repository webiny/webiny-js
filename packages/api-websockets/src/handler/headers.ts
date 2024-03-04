import { IWebsocketsEventData, IWebsocketsIncomingEvent } from "~/handler/types";

const getEventBody = (event: IWebsocketsIncomingEvent): IWebsocketsEventData => {
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

const getToken = (body: IWebsocketsEventData, event: IWebsocketsIncomingEvent): string | null => {
    return body?.token || event.queryStringParameters?.token || null;
};

const getTenant = (body: IWebsocketsEventData, event: IWebsocketsIncomingEvent): string => {
    return body?.tenant || event.queryStringParameters?.tenant || "root";
};

const getLocale = (body: IWebsocketsEventData, event: IWebsocketsIncomingEvent): string => {
    return body?.locale || event.queryStringParameters?.locale || "en-US";
};

export const getEventValues = (event: IWebsocketsIncomingEvent) => {
    const body = getEventBody(event);

    const token = getToken(body, event);
    const tenant = getTenant(body, event);
    const locale = getLocale(body, event);
    return {
        tenant,
        locale,
        token,
        endpoint: "manage"
    };
};
