import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { ComponentExtractionPermissions } from "~/features/permissions/abstractions.js";
import { COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA } from "~/constants.js";

export const HasPermission = createHasPermission<typeof COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA>(
    ComponentExtractionPermissions
);
