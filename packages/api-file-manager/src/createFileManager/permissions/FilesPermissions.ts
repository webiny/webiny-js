import { AppPermissions } from "@webiny/api-security/utils/AppPermissions";
import { FilePermission } from "~/types";

export class FilesPermissions extends AppPermissions<FilePermission> {}
