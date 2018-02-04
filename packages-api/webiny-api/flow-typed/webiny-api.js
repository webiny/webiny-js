import { express$Request, express$Response } from "../flow-typed/npm/express_v4.x.x";
import { Endpoint } from "webiny-api";

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

declare interface IApiContainer {
    get(name: string, pattern: string, fn?: Function): ?IApiMethod;

    post(name: string, pattern: string, fn?: Function): ?IApiMethod;

    patch(name: string, pattern: string, fn?: Function): ?IApiMethod;

    delete(name: string, pattern: string, fn?: Function): ?IApiMethod;

    removeMethod(name: string): void;

    getMethods(): IApiMethods;

    getMethod(name: string): ?IApiMethod;

    api(name: string, httpMethod: string, pattern: string, callable?: Function): ?IApiMethod;

    matchMethod(httpMethod: string, url: string): ?IMatchedApiMethod;
}
