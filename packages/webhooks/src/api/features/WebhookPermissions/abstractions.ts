import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WebhookPermissions = createPermissionsAbstraction(WEBHOOK_PERMISSIONS_SCHEMA);

export namespace WebhookPermissions {
    export type Interface = Permissions<typeof WEBHOOK_PERMISSIONS_SCHEMA>;
}
