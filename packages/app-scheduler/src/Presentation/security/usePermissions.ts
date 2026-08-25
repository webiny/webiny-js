import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(SchedulerPermissions);
