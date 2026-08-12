import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA } from "~/constants.js";
import { ComponentExtractionPermissions } from "./abstractions.js";

export const ComponentExtractionPermissionsFeature = createPermissionsFeature(
    COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA,
    ComponentExtractionPermissions
);
