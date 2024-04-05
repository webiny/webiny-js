import { ILockingMechanismError } from "~/types";

export interface IError extends Error {
    code?: string;
    data?: any;
}

export const createLockingMechanismError = (
    error: IError | ILockingMechanismError
): ILockingMechanismError => {
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
