import { createImplementation } from "@webiny/di-container";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { WcpContext } from "@webiny/api-core/features/WcpContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/ListUserTeams";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import {
    CanAccessFolder,
    CanAccessFolderContent,
    type CanAccessFolderContentParams,
    type CanAccessFolderParams,
    CanCreateFolderInRoot,
    CheckNotInheritedPermissions,
    GetDefaultPermissions,
    GetDefaultPermissionsWithTeams
} from "./useCases/index.js";
import { FolderLevelPermissions as FolderLevelPermissionsAbstraction } from "./abstractions.js";
import type { FolderLevelPermission, FolderPermission, ListFlpsParams } from "~/types.js";
import { ListFlpsUseCase } from "~/features/flp/ListFlps/index.js";
import { GetFlpUseCase } from "~/features/flp/GetFlp/index.js";

class FolderLevelPermissionsImpl implements FolderLevelPermissionsAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private wcpContext: WcpContext.Interface,
        private listUserTeamsUseCase: ListUserTeamsUseCase.Interface,
        private getFlpUseCase: GetFlpUseCase.Interface,
        private listFlpsUseCase: ListFlpsUseCase.Interface
    ) {}

    public canUseFolderLevelPermissions(enabled?: boolean): boolean {
        if (enabled === false) {
            return false;
        }

        const identity = this.identityContext.getIdentity();

        // FLPs only work with authenticated identities (logged-in users).
        if (!identity) {
            return false;
        }

        // At the moment, we only want FLP to be used with identities of type "admin".
        // This temporarily addresses the issue of API keys not being able to access content, because
        // FLPs doesn't work with them. Once we start adding FLPs to API keys, we can remove this check.
        if (identity.type !== "admin") {
            return false;
        }

        return this.wcpContext.canUseFolderLevelPermissions();
    }

    public canUseTeams(): boolean {
        return this.wcpContext.canUseTeams();
    }

    public canCreateFolderInRoot(): boolean {
        const canCreateFolderInRootUseCase = new CanCreateFolderInRoot();
        return canCreateFolderInRootUseCase.execute();
    }

    public permissionsIncludeNonInheritedPermissions(permissions: FolderPermission[]): boolean {
        const checkNotInheritedPermissionsUseCase = new CheckNotInheritedPermissions();
        return checkNotInheritedPermissionsUseCase.execute(permissions);
    }

    public async canAccessFolder(params: CanAccessFolderParams): Promise<boolean> {
        if (
            !this.canUseFolderLevelPermissions() ||
            !this.identityContext.isAuthorizationEnabled()
        ) {
            return true;
        }

        const canAccessFolderUseCase = new CanAccessFolder(this.identityContext);
        return await canAccessFolderUseCase.execute(params);
    }

    public async canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean> {
        if (
            !this.canUseFolderLevelPermissions() ||
            !this.identityContext.isAuthorizationEnabled()
        ) {
            return true;
        }

        const canAccessFolderContentUseCase = new CanAccessFolderContent(this.identityContext);
        return await canAccessFolderContentUseCase.execute(params);
    }

    public async ensureCanAccessFolder(params: CanAccessFolderParams): Promise<void> {
        const result = await this.canAccessFolder(params);
        if (!result) {
            throw new NotAuthorizedError();
        }
    }

    public async ensureCanAccessFolderContent(params: CanAccessFolderContentParams): Promise<void> {
        const result = await this.canAccessFolderContent(params);
        if (!result) {
            throw new NotAuthorizedError();
        }
    }

    public async canManageFolderContent(flp: FolderLevelPermission): Promise<boolean> {
        if (
            !this.canUseFolderLevelPermissions() ||
            !this.identityContext.isAuthorizationEnabled()
        ) {
            return true;
        }

        return await this.canAccessFolderContent({ permissions: flp.permissions, rwd: "w" });
    }

    public async canManageFolderStructure(flp: FolderLevelPermission): Promise<boolean> {
        if (
            !this.canUseFolderLevelPermissions() ||
            !this.identityContext.isAuthorizationEnabled()
        ) {
            return true;
        }

        return await this.canAccessFolder({ permissions: flp.permissions, rwd: "w" });
    }

    public async canManageFolderPermissions(flp: FolderLevelPermission): Promise<boolean> {
        if (!this.canUseFolderLevelPermissions()) {
            return false;
        }

        if (!this.identityContext.isAuthorizationEnabled()) {
            return true;
        }

        return await this.canAccessFolder({
            permissions: flp.permissions,
            rwd: "w",
            managePermissions: true
        });
    }

    public getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]> {
        const getDefaultPermissionsUseCase = new GetDefaultPermissions(this.identityContext);

        if (this.canUseTeams()) {
            const getDefaultPermissionsWithTeams = new GetDefaultPermissionsWithTeams(
                this.identityContext,
                this.listUserTeamsUseCase,
                getDefaultPermissionsUseCase
            );

            return getDefaultPermissionsWithTeams.execute(permissions);
        }

        return getDefaultPermissionsUseCase.execute(permissions);
    }

    public async listFolderLevelPermissions(params: ListFlpsParams): Promise<
        Array<{
            id: string;
            permissions: FolderPermission[];
        }>
    > {
        const flps = await this.listFlpsUseCase.execute(params);

        return Promise.all(
            flps.map(async flp => ({
                id: flp.id,
                permissions: await this.getDefaultPermissions(flp.permissions)
            }))
        );
    }

    public async getFolderLevelPermissions(id: string): Promise<FolderPermission[]> {
        const flp = await this.getFlpUseCase.execute(id);
        return await this.getDefaultPermissions(flp?.permissions ?? []);
    }
}

export const FolderLevelPermissions = createImplementation({
    abstraction: FolderLevelPermissionsAbstraction,
    implementation: FolderLevelPermissionsImpl,
    dependencies: [
        IdentityContext,
        WcpContext,
        ListUserTeamsUseCase,
        GetFlpUseCase,
        ListFlpsUseCase
    ]
});
