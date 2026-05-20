import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(WebhookPermissions);
