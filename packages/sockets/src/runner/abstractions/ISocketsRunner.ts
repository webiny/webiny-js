import { ISocketsIncomingEvent } from "~/handler/types";
import { GenericRecord } from "@webiny/api/types";

export interface ISocketsResponseError {
    message: string;
    code: string;
    data?: GenericRecord<string> | null;
    stack?: string;
}
export interface ISocketsRunnerResponse {
    statusCode: number;
    message?: string;
    error?: ISocketsResponseError;
}

export interface ISocketsRunner {
    run(params: ISocketsIncomingEvent): Promise<ISocketsRunnerResponse>;
}
