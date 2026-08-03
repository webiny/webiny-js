import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(ThemePermissions);
