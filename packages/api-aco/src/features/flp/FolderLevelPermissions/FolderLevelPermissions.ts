import { NotAuthorizedError } from "@webiny/api-security";
import {
    CanAccessFolder,
    CanAccessFolderContent,
    type CanAccessFolderContentParams,
    type CanAccessFolderParams,
    CanCreateFolderInRoot,
    CanUseFolderLevelPermissions,
    CanUseTeams,
    CheckNotInheritedPermissions,
    GetDefaultPermissions,
    GetDefaultPermissionsWithTeams,
    GetFolderPermission,
    ListFolderPermissions
} from "./useCases/index.js";
import type { FolderLevelPermissions as FolderLevelPermissionsAbstraction } from "./abstractions.js";
import type {
    AcoContext,
    AcoFolderLevelPermissionsCrud,
    FolderLevelPermission,
    FolderPermission,
    ListFlpsParams
} from "~/types.js";
import {
    GetIdentityGatewayFromContext,
    GetWcpGatewayFromContext,
    type IGetIdentityGateway,
    type IGetWcpGateway,
    type IIsAuthorizationEnabledGateway,
    type IListIdentityTeamsGateway,
    type IListPermissionsGateway,
    IsAuthorizationEnabledGatewayFromContext,
    ListIdentityTeamsGatewayFromContext,
    ListPermissionsGatewayFromContext
} from "./gateways/index.js";

export class FolderLevelPermissions implements FolderLevelPermissionsAbstraction.Interface {
    private crud: AcoFolderLevelPermissionsCrud;

    private readonly getWcpGateway: IGetWcpGateway;
    private readonly getIdentityGateway: IGetIdentityGateway;
    private readonly listPermissionsGateway: IListPermissionsGateway;
    private readonly listIdentityTeamsGateway: IListIdentityTeamsGateway;
    private readonly isAuthorizationEnabledGateway: IIsAuthorizationEnabledGateway;

    constructor(context: AcoContext, crud: AcoFolderLevelPermissionsCrud) {
        this.crud = crud;
        this.getWcpGateway = new GetWcpGatewayFromContext(context);
        this.getIdentityGateway = new GetIdentityGatewayFromContext(context);
        this.listPermissionsGateway = new ListPermissionsGatewayFromContext(context);
        this.listIdentityTeamsGateway = new ListIdentityTeamsGatewayFromContext(context);
        this.isAuthorizationEnabledGateway = new IsAuthorizationEnabledGatewayFromContext(context);
    }

    public canUseFolderLevelPermissions(enabled?: boolean): boolean {
        const canUseFolderLevelPermissionsUseCase = new CanUseFolderLevelPermissions(
            this.getWcpGateway,
            this.getIdentityGateway
        );
        return canUseFolderLevelPermissionsUseCase.execute(enabled);
    }

    public canUseTeams(): boolean {
        const canUseTeamsUseCase = new CanUseTeams(this.getWcpGateway);
        return canUseTeamsUseCase.execute();
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
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabledGateway.execute()) {
            return true;
        }

        const canAccessFolderUseCase = new CanAccessFolder(this.getIdentityGateway);
        return await canAccessFolderUseCase.execute(params);
    }

    public async canAccessFolderContent(params: CanAccessFolderContentParams): Promise<boolean> {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabledGateway.execute()) {
            return true;
        }

        const canAccessFolderContentUseCase = new CanAccessFolderContent(this.getIdentityGateway);
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
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabledGateway.execute()) {
            return true;
        }

        return await this.canAccessFolderContent({ permissions: flp.permissions, rwd: "w" });
    }

    public async canManageFolderStructure(flp: FolderLevelPermission): Promise<boolean> {
        if (!this.canUseFolderLevelPermissions() || !this.isAuthorizationEnabledGateway.execute()) {
            return true;
        }

        return await this.canAccessFolder({ permissions: flp.permissions, rwd: "w" });
    }

    public async canManageFolderPermissions(flp: FolderLevelPermission): Promise<boolean> {
        if (!this.canUseFolderLevelPermissions()) {
            return false;
        }

        if (!this.isAuthorizationEnabledGateway.execute()) {
            return true;
        }

        return await this.canAccessFolder({
            permissions: flp.permissions,
            rwd: "w",
            managePermissions: true
        });
    }

    public getDefaultPermissions(permissions: FolderPermission[]): Promise<FolderPermission[]> {
        const getDefaultPermissionsUseCase = new GetDefaultPermissions(
            this.getIdentityGateway,
            this.listPermissionsGateway
        );

        if (this.canUseTeams()) {
            const getDefaultPermissionsWithTeams = new GetDefaultPermissionsWithTeams(
                this.getIdentityGateway,
                this.listIdentityTeamsGateway,
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
        const listFolderLevelPermissionsUseCase = new ListFolderPermissions(this.crud.list);
        const flps = await listFolderLevelPermissionsUseCase.execute(params);

        return Promise.all(
            flps.map(async flp => ({
                id: flp.id,
                permissions: await this.getDefaultPermissions(flp.permissions)
            }))
        );
    }

    public async getFolderLevelPermissions(id: string): Promise<FolderPermission[]> {
        const getFolderLevelPermissionUseCase = new GetFolderPermission(this.crud.get);
        const flp = await getFolderLevelPermissionUseCase.execute(id);
        return await this.getDefaultPermissions(flp?.permissions ?? []);
    }
}
