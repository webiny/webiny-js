import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/api/permissions.js";
import { BackgroundTaskPermissions } from "./abstractions.js";

export const BackgroundTaskPermissionsFeature = createPermissionsFeature(
    BACKGROUND_TASK_PERMISSIONS_SCHEMA,
    BackgroundTaskPermissions
);
