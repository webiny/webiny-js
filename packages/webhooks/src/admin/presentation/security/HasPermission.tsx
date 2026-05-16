import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const HasPermission = createHasPermission(WebhookPermissions, WEBHOOK_PERMISSIONS_SCHEMA);
