import type { IResponseError } from "~/api/response/abstractions/index.js";
import { getObjectProperties } from "~/api/utils/getObjectProperties.js";

export const getErrorProperties = (error: Error | IResponseError): IResponseError => {
    const value = getObjectProperties<IResponseError>(error);

    delete value.stack;

    return value;
};
