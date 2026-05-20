import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(TaskPermissions);
