import { createAbstraction } from "@webiny/feature/api";
import type { AppPermissions } from "@webiny/api-core/features/security/utils/AppPermissions.js";
import type { FilePermission, SettingsPermission } from "~/types.js";

type IFilePermissions = AppPermissions<FilePermission>;

export const FilePermissions = createAbstraction<IFilePermissions>("FilePermissions");

export namespace FilePermissions {
    export type Interface = IFilePermissions;
}

type ISettingsPermissions = AppPermissions<SettingsPermission>;

export const SettingsPermissions = createAbstraction<ISettingsPermissions>("SettingsPermission");

export namespace SettingsPermissions {
    export type Interface = ISettingsPermissions;
}
