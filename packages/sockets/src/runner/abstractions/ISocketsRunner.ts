import { ISocketsEvent } from "~/handler/types";
import { GenericRecord } from "@webiny/api/types";
import { PartialDeep } from "type-fest";

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

export type ISocketsRunnerRunParams = PartialDeep<ISocketsEvent>;

export interface ISocketsRunner {
    run(params: ISocketsRunnerRunParams): Promise<ISocketsRunnerResponse>;
}
