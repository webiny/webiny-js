import type { IHandler } from "./types.js";
import { createOnRequestResponseSend, createOnRequestTimeout } from "@webiny/handler";
import type { Request as FastifyRequest } from "@webiny/handler/types";
import { convertException } from "@webiny/utils/exception.js";

const execute = async (handler: IHandler) => {
    try {
        return await handler.flush();
    } catch (ex) {
        const error = convertException(ex);
        console.error({
            flushError: error
        });
        return {
            error
        };
        /**
         * We do not want to throw an error here, because we are in the request end.
         */
    }
};

const isOptionsRequest = (request: FastifyRequest): boolean => {
    if (!request?.method) {
        return false;
    }
    return request.method.toUpperCase() === "OPTIONS";
};

export const createSendDataToEventBridgeOnRequestEnd = (handler: IHandler) => {
    const onRequestResponseSend = createOnRequestResponseSend(async (request, _, payload) => {
        if (isOptionsRequest(request)) {
            return payload;
        }
        await execute(handler);
        return payload;
    });
    onRequestResponseSend.name = "sync.onRequestResponseSend";

    const onRequestTimeout = createOnRequestTimeout(async request => {
        if (isOptionsRequest(request)) {
            return;
        }
        return await execute(handler);
    });
    onRequestTimeout.name = "sync.onRequestTimeout";

    return [onRequestResponseSend, onRequestTimeout];
};
