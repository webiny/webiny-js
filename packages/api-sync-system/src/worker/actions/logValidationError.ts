import type { ZodError } from "zod";
import { convertException, createZodError } from "@webiny/utils";

export const logValidationError = (error?: ZodError): void => {
    if (process.env.DEBUG !== "true" || !error) {
        return;
    }
    const ex = createZodError(error);
    console.log(convertException(ex));
};
