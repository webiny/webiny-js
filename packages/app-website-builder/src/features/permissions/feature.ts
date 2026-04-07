import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";
import { WbPermissions } from "./abstractions.js";

export const WbPermissionsFeature = createPermissionsFeature(WB_PERMISSIONS_SCHEMA, WbPermissions);
