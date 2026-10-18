import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";

const FALLBACK_MESSAGE = "The request failed.";

/*
 * The error a use case throws for an envelope that carries an error, or neither data nor error
 * (R204): the server's message, code and data, with a fallback message.
 */
export const toOperationError = (error: EditorErrorDto | null): GraphQLOperationError => {
    return new GraphQLOperationError({
        message: error?.message ?? FALLBACK_MESSAGE,
        code: error?.code ?? null,
        data: error?.data ?? null
    });
};
