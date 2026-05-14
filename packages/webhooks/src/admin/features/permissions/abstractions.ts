import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WebhookPermissions = createPermissionsAbstraction(WEBHOOK_PERMISSIONS_SCHEMA);

export namespace WebhookPermissions {
    export type Interface = Permissions<typeof WEBHOOK_PERMISSIONS_SCHEMA>;
}
