import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { RC_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";
import { RemoteComponentPermissions } from "./abstractions.js";

export const RemoteComponentPermissionsFeature = createPermissionsFeature(
    RC_PERMISSIONS_SCHEMA,
    RemoteComponentPermissions
);
