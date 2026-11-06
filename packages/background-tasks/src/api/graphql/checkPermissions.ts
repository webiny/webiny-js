import type { Context } from "~/api/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { BackgroundTaskPermissions } from "~/api/features/BackgroundTaskPermissions/abstractions.js";

/**
 * Checks the caller's `backgroundTasks.task` permission for the given action.
 *
 * @throws
 */
export const checkPermissions = async (
    context: Context,
    check: { rwd: "r" | "w" | "d" }
): Promise<void> => {
    const permissions = context.container.resolve(BackgroundTaskPermissions);

    let allowed: boolean;
    switch (check.rwd) {
        case "r":
            allowed = await permissions.canRead("task");
            break;
        case "w":
            allowed = await permissions.canEdit("task");
            break;
        case "d":
            allowed = await permissions.canDelete("task");
            break;
    }

    if (!allowed) {
        throw new NotAuthorizedError();
    }
};
