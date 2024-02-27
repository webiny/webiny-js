import { CmsEntryPermission } from "~/types";
import { AppPermissions } from "@webiny/api-security";

export class EntriesPermissions extends AppPermissions<CmsEntryPermission> {}
