import {
    createPermissionsAbstraction,
    createPermissionsFeature,
    type Permissions
} from "@webiny/api-core/features/security/permissions/index.js";
import { COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const ComponentExtractionPermissions = createPermissionsAbstraction(
    COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA
);

export namespace ComponentExtractionPermissions {
    export type Interface = Permissions<typeof COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA>;
}

export const ComponentExtractionPermissionsFeature = createPermissionsFeature(
    COMPONENT_EXTRACTION_PERMISSIONS_SCHEMA,
    ComponentExtractionPermissions
);
