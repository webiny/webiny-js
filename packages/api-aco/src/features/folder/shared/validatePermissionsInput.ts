import type { FolderPermission } from "~/flp/flp.types.js";
import { FolderValidationError } from "~/domain/folder/errors.js";

/**
 * Validates folder permissions sent by the client (create and update).
 * Only user and team targets are allowed, and inherited permissions cannot be set manually.
 */
export const validatePermissionsInput = (
    permissions: Pick<FolderPermission, "target" | "inheritedFrom">[]
): FolderValidationError | null => {
    for (const permission of permissions) {
        const targetIsValid =
            typeof permission.target === "string" &&
            (permission.target.startsWith("admin:") || permission.target.startsWith("team:"));
        if (!targetIsValid) {
            return new FolderValidationError(
                `Permission target "${permission.target}" is not valid.`
            );
        }

        if (permission.inheritedFrom) {
            return new FolderValidationError(`Permission "inheritedFrom" cannot be set manually.`);
        }
    }

    return null;
};
