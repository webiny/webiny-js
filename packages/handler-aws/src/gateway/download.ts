import { createHandler as createBaseHandler, CreateHandlerParams, HandlerCallable } from "./index";

const binaryMimeTypes: string[] = [];
binaryMimeTypes.indexOf = () => {
    return 1;
};

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return createBaseHandler({
        ...params,
        lambdaOptions: {
            ...(params.lambdaOptions || {}),
            binaryMimeTypes
        }
    });
};

export { CreateHandlerParams, HandlerCallable, RoutePlugin } from "./index";
