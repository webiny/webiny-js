import { ISocketsEvent } from "~/handler/types";
import { ISocketsConnectionRegistry } from "~/registry";

export interface ISocketsResponseError {
    message: string;
    code: string;
    data: Record<string, any>;
    stack?: string;
}
export interface ISocketsResponse {
    statusCode: number;
    message?: string;
    error?: ISocketsResponseError;
}

export interface ISockets {
    registry: ISocketsConnectionRegistry;

    run(event: ISocketsEvent): Promise<ISocketsResponse>;
}
