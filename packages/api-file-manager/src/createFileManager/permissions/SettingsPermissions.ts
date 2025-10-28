import type { SettingsPermission } from "~/types.js";
import { AppPermissions } from "@webiny/api-core/features/security/utils/AppPermissions.js";

export class SettingsPermissions extends AppPermissions<SettingsPermission> {}
