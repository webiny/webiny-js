import type { FilePermission } from "~/types.js";
import { AppPermissions } from "@webiny/api-core/features/security/utils/AppPermissions.js";

export class FilesPermissions extends AppPermissions<FilePermission> {}
