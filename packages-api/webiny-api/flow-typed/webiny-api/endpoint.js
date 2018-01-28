import { express$Request, express$Response } from "../../../flow-typed/npm/express_v4.x.x";
import { Endpoint } from "./../..";

declare type EndpointsMap = {
    [url: string]: {
        classId: string,
        versions: { [version: string]: Class<Endpoint> },
        latest: string
    }
};

declare interface IApiResponse {
    getStatusCode(): number;

    setStatusCode(statusCode: number): void;

    getData(format: ?boolean): Object;

    setData(data: Object): void;

    getMessage(): string;

    setMessage(message: string): void;

    toJSON(): Object;
}

declare interface IApiMethod {
    getPattern(): string;

    getRegex(): RegExp;

    exec(
        req: express$Request,
        res: express$Response,
        params: Object,
        context: Endpoint
    ): IApiResponse;

    addCallback(callable: Function): void;
}

declare type IApiMethods = {
    [key: string]: { [key: string]: IApiMethod }
};

declare interface IMatchedApiMethod {
    getApiMethod(): IApiMethod;

    getParams(): Object;
}

declare interface IApiContainer {
    get(pattern: string, fn?: Function): ?IApiMethod;

    post(pattern: string, fn?: Function): ?IApiMethod;

    patch(pattern: string, fn?: Function): ?IApiMethod;

    delete(pattern: string, fn?: Function): ?IApiMethod;

    removeMethod(http: string, pattern: string): void;

    getMethods(): IApiMethods;

    getMethod(httpMethod: string, pattern: string): ?IApiMethod;

    api(httpMethod: string, pattern: string, callable?: Function): ?IApiMethod;

    matchMethod(httpMethod: string, url: string): ?IMatchedApiMethod;
}
