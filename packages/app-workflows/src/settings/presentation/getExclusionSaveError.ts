import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { GENERIC_ERROR } from "~/review/presentation/actionDialog/reviewErrorMessages.js";

/*
 * The dialog alert after a failed save (R325, Q68.2, QBZ-74): any server error (Validation,
 * Persistence, NotAuthorized) shows its message, a transport failure the standard alert.
 */
export const getExclusionSaveError = (error: unknown): string => {
    if (error instanceof GraphQLOperationError) {
        return `Could not save: ${error.message}`;
    }
    return GENERIC_ERROR;
};
