import { createPermissionsFeature } from "~/exports/admin/security.js";
import { SECURITY_PERMISSIONS_SCHEMA } from "~/domain/securityPermissionsSchema.js";
import { SecurityPermissions } from "./abstractions.js";

export const SecurityPermissionsFeature = createPermissionsFeature(
    SECURITY_PERMISSIONS_SCHEMA,
    SecurityPermissions
);
