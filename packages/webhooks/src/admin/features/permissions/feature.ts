import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { WebhookPermissions } from "./abstractions.js";

export const WebhookPermissionsFeature = createPermissionsFeature(
    WEBHOOK_PERMISSIONS_SCHEMA,
    WebhookPermissions
);
