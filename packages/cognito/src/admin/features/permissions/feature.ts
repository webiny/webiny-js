import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { CognitoPermissions } from "./abstractions.js";
import { COGNITO_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";

export const CognitoPermissionsFeature = createPermissionsFeature(
    COGNITO_PERMISSIONS_SCHEMA,
    CognitoPermissions
);
