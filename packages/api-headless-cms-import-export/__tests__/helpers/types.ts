export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export interface IInvokeCb {
    <T = any>(params: InvokeParams): Promise<[T, any]>;
}
