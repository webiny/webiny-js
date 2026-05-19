import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const HasPermission =
    createHasPermission<typeof WEBHOOK_PERMISSIONS_SCHEMA>(WebhookPermissions);
