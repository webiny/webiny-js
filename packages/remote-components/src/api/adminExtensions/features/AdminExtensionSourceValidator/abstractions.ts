import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

export interface IAdminExtensionSourceValidator {
    readonly kind: AdminExtensionKind;
    /** Returns the source as it should be stored, or why it cannot be. */
    validate(source: string): Result<string, AdminExtensionValidationError>;
}

/**
 * Checks the `source` of one kind before it is saved. A kind with no validator registered cannot be
 * created at all, so a kind is only writable once something knows what its source must look like.
 */
export const AdminExtensionSourceValidator = createAbstraction<IAdminExtensionSourceValidator>(
    "RemoteComponents/AdminExtensionSourceValidator"
);

export namespace AdminExtensionSourceValidator {
    export type Interface = IAdminExtensionSourceValidator;
}
