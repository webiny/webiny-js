import { ISocketsEventData, ISocketsIncomingEvent } from "~/handler/types";

const getEventBody = (event: ISocketsIncomingEvent): ISocketsEventData => {
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

const getToken = (body: ISocketsEventData, event: ISocketsIncomingEvent): string | null => {
    return body?.token || event.queryStringParameters?.token || null;
};

const getTenant = (body: ISocketsEventData, event: ISocketsIncomingEvent): string => {
    return body?.tenant || event.queryStringParameters?.tenant || "root";
};

const getLocale = (body: ISocketsEventData, event: ISocketsIncomingEvent): string => {
    return body?.locale || event.queryStringParameters?.locale || "en-US";
};

export const getEventValues = (event: ISocketsIncomingEvent) => {
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
