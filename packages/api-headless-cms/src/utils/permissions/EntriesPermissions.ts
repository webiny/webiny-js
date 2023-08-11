import { CmsEntryPermission } from "~/types";
import { AppPermissions, EnsureParams as BaseEnsureParams, Options } from "@webiny/api-security";
import NotAuthorizedError from "@webiny/api-security/NotAuthorizedError";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface CanAccessFolderParams {
    identity: SecurityIdentity;
    folder: {
        id: string;
    };
    rwd?: "r" | "w" | "d";
}

export interface EnsureParams extends BaseEnsureParams {
    canAccessFolder?: {
        folder: { id: string };
        rwd?: "r" | "w" | "d";
    };
}

export type CanAccessFolderHandler = (params: CanAccessFolderParams) => Promise<boolean>;

export class EntriesPermissions extends AppPermissions<CmsEntryPermission> {
    canAccessFolderHandler?: CanAccessFolderHandler;

    public setCanAccessFolderHandler(canAccessFolderHandler: CanAccessFolderHandler) {
        this.canAccessFolderHandler = canAccessFolderHandler;
    }

    public async canAccessFolder(params: CanAccessFolderParams): Promise<boolean> {
        if (this.canAccessFolderHandler) {
            return this.canAccessFolderHandler(params);
        }

        throw new Error("Cannot perform canAccessFolder check. No handler provided.");
    }

    public override async ensure(
        params: EnsureParams = {},
        options: Options = {}
    ): Promise<boolean> {
        // This function either returns true or throws an error. If it doesn't throw,
        // we want to check if the result was false. If that's the case, we exit early.
        const hasAccess = await super.ensure(params, options);
        if (!hasAccess) {
            return false;
        }

        // Once the initial set of permissions is ensured, we still need to
        // check if the user has access based on folder-level permissions.
        if (params.canAccessFolder) {
            const { canAccessFolder } = params;
            const hasFolderAccess = await this.canAccessFolder({
                folder: canAccessFolder.folder,
                identity: await this.getIdentity(),
                rwd: canAccessFolder.rwd
            });
            if (!hasFolderAccess) {
                if (options.throw === false) {
                    return false;
                }
                throw new NotAuthorizedError();
            }
        }

        return true;
    }
}
