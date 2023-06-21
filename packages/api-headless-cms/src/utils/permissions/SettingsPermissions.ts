import { CmsSettingsPermission } from "~/types";
import { AppPermissions } from "@webiny/api-security";

export class SettingsPermissions extends AppPermissions<CmsSettingsPermission> {}
