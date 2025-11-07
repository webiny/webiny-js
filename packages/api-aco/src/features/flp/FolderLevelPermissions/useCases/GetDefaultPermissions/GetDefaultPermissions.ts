import type { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { IGetDefaultPermissions } from "./IGetDefaultPermissions.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { DefaultPermissionsMerger } from "./DefaultPermissionsMerger.js";

export class GetDefaultPermissions implements IGetDefaultPermissions {
    constructor(private identityContext: IdentityContext.Interface) {}

    async execute(permissions: FolderPermission[]) {
        const identity = this.identityContext.getIdentity();
        const identityPermissions = await this.identityContext.listPermissions();

        return DefaultPermissionsMerger.merge(identity, identityPermissions, permissions);
    }
}
