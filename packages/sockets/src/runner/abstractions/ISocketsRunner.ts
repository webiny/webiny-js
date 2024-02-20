import { ISocketsEvent, ISocketsEventData } from "~/handler/types";
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

export type ISocketsRunnerRunParams<T extends ISocketsEventData = ISocketsEventData> = PartialDeep<
    ISocketsEvent<T>
>;

export interface ISocketsRunner {
    run<T extends ISocketsEventData = ISocketsEventData>(
        params: ISocketsRunnerRunParams<T>
    ): Promise<ISocketsRunnerResponse>;
}
