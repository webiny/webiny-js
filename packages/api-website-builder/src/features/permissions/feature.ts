import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { WB_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { WbPermissions } from "./abstractions.js";

export const WbPermissionsFeature = createPermissionsFeature(WB_PERMISSIONS_SCHEMA, WbPermissions);
