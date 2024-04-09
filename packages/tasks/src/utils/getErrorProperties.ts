import { IResponseError } from "~/response/abstractions";
import { getObjectProperties } from "~/utils/getObjectProperties";

export const getErrorProperties = (error: Error): IResponseError => {
    return getObjectProperties<IResponseError>(error);
};
