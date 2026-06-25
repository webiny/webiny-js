import type { IWebsocketsEvent } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IWebsocketsResponseError {
    message: string;
    code: string;
    data?: GenericRecord<string> | null;
    stack?: string;
}

export interface IWebsocketsRunnerResponse {
    statusCode: number;
    message?: string;
    error?: IWebsocketsResponseError;
}

export interface IWebsocketsRunner {
    run(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse>;
}
