import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/api/permissions.js";

export const BackgroundTaskPermissions = createPermissionsAbstraction(
    BACKGROUND_TASK_PERMISSIONS_SCHEMA
);

export namespace BackgroundTaskPermissions {
    export type Interface = Permissions<typeof BACKGROUND_TASK_PERMISSIONS_SCHEMA>;
}
