import type { GenericRecord } from "@webiny/api/types.js";
import type { SecurityIdentity } from "~/types/security.js";

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;

export interface IWebsocketsTransportSendDataError {
    message: string;
    code: string;
    data?: GenericRecord;
    stack?: string;
}

export interface IWebsocketsTransportSendData<T extends GenericRecord> {
    messageId?: string;
    action?: string;
    data?: T;
    error?: IWebsocketsTransportSendDataError;
}
