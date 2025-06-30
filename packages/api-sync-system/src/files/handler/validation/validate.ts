import type { IFileHandlerEvent } from "~/files/handler/types.js";
import { createValidationSchema } from "~/files/handler/validation/schema.js";

export interface IValidatePayload {
    payload: IFileHandlerEvent | unknown;
}

export const validatePayload = async (params: IValidatePayload) => {
    const schema = createValidationSchema();

    return await schema.safeParseAsync(params.payload);
};
