import { createUsePermissions } from "@webiny/app-admin/exports/admin.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(WbPermissions);
