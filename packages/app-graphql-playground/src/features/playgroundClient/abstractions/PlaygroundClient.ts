import { createAbstraction } from "@webiny/feature/admin";

type IHeaders = Record<string, string>;

type IVariables = Record<string, any>;

type IResponse = Record<string, any>;

interface ITokenGetter {
    (): Promise<string | null>;
}

interface IPlaygroundClientRequest {
    query: string;
    endpoint?: string;
    variables?: IVariables;
    headers?: IHeaders;
}

export interface IPlaygroundClient {
    execute(params: IPlaygroundClientRequest): Promise<IResponse>;
}

export const PlaygroundClient = createAbstraction<IPlaygroundClient>("PlaygroundClient");

export namespace PlaygroundClient {
    export type Headers = IHeaders;
    export type Interface = IPlaygroundClient;
    export type Request = IPlaygroundClientRequest;
    export type Response = IResponse;
    export type TokenGetter = ITokenGetter;
}
