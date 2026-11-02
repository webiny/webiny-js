import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { OperationErrorDto } from "./OperationErrorDto.js";

const FALLBACK_MESSAGE = "The request failed.";

/*
 * The error an area gateway throws for an envelope that carries an error, or neither data nor
 * error (R346): the server's message, code and data, with a fallback message.
 */
export const toOperationError = (error: OperationErrorDto | null): GraphQLOperationError => {
    return new GraphQLOperationError({
        message: error?.message ?? FALLBACK_MESSAGE,
        code: error?.code ?? null,
        data: error?.data ?? null
    });
};
