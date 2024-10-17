import { IResponseError } from "~/response/abstractions";
import { getObjectProperties } from "~/utils/getObjectProperties";

export const getErrorProperties = (error: Error | IResponseError): IResponseError => {
    const value = getObjectProperties<IResponseError>(error);

    delete value.stack;

    return value;
};
