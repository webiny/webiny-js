import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { FRONTEND_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";
import { FrontendPermissions } from "./abstractions.js";

export const FrontendPermissionsFeature = createPermissionsFeature(
    FRONTEND_PERMISSIONS_SCHEMA,
    FrontendPermissions
);
