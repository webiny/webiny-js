import { IRecordLockingError } from "~/types";

export interface IError extends Error {
    code?: string;
    data?: any;
}

export const createRecordLockingError = (
    error: IError | IRecordLockingError
): IRecordLockingError => {
    if (error instanceof Error) {
        return {
            message: error.message,
            code: error.code || "UNKNOWN_ERROR",
            data: error.data
        };
    }
    return {
        message: error.message,
        code: error.code,
        data: error.data
    };
};
