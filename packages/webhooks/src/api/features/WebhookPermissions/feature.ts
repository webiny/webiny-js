import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/api/permissions.js";
import { WebhookPermissions } from "./abstractions.js";

export const WebhookPermissionsFeature = createPermissionsFeature(
    WEBHOOK_PERMISSIONS_SCHEMA,
    WebhookPermissions
);
