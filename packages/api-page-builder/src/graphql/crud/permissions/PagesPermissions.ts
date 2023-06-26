import { PageSecurityPermission } from "~/types";
import { AppPermissions } from "@webiny/api-security";

export class PagesPermissions extends AppPermissions<PageSecurityPermission> {}
