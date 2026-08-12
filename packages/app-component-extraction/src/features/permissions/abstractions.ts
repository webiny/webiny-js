import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA } from "~/constants.js";

export const ComponentExtractionPermissions = createPermissionsAbstraction(
    COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA
);

export namespace ComponentExtractionPermissions {
    export type Interface = Permissions<typeof COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA>;
}
