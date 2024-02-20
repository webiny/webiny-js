import { IResponseError } from "~/response/abstractions";

/**
 * Unfortunately we need some casting as we do not know which properties are available on the error object.
 */
export const getErrorProperties = (error: Error): IResponseError => {
    return Object.getOwnPropertyNames(error).reduce<Record<string, any>>((acc, key) => {
        acc[key] = error[key as keyof Error];
        return acc;
    }, {}) as unknown as IResponseError;
};
