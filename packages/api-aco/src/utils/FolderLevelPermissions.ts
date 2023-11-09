import { Authentication } from "@webiny/api-authentication/types";
import { SecurityPermission, Team } from "@webiny/api-security/types";
import { Folder } from "~/folder/folder.types";
import { NotAuthorizedError } from "@webiny/api-security";
import structuredClone from "@ungap/structured-clone";

export type FolderAccessLevel = "owner" | "viewer" | "editor" | "public";

export interface FolderPermission {
    target: string;
    level: FolderAccessLevel;
    inheritedFrom?: string;
}

export interface FolderPermissionsListItem {
    folderId: string;
    permissions: FolderPermission[];
}

export type FolderPermissionsList = FolderPermissionsListItem[];

export interface CanAccessFolderContentParams {
    folder: Pick<Folder, "id" | "type" | "parentId">;
    rwd?: "r" | "w" | "d";
    foldersList?: Folder[];
}

export interface CanAccessFolderParams extends CanAccessFolderContentParams {
    managePermissions?: boolean;
}

interface FilterFoldersParams {
    folders: Array<Folder>;
    rwd?: "r" | "w" | "d";
}

interface GetFolderPermissionsParams {
    folder: Pick<Folder, "id" | "type">;
    foldersList?: Folder[];
}

interface ListFolderPermissionsParams {
    folderType: string;
    foldersList?: Folder[];
}

export interface FolderLevelPermissionsParams {
    getIdentity: Authentication["getIdentity"];
    getIdentityTeam: () => Promise<Team | null>;
    listPermissions: () => Promise<SecurityPermission[]>;
    listAllFolders: (folderType: string) => Promise<Folder[]>;
    canUseTeams: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
}

export class FolderLevelPermissions {
    private readonly getIdentity: Authentication["getIdentity"];
    private readonly getIdentityTeam: () => Promise<Team | null>;
    private readonly listPermissions: () => Promise<SecurityPermission[]>;
    private readonly listAllFoldersCallback: (folderType: string) => Promise<Folder[]>;
    private readonly canUseTeams: () => boolean;
    private readonly canUseFolderLevelPermissions: () => boolean;
    private allFolders: Record<string, Folder[]> = {};

    constructor(params: FolderLevelPermissionsParams) {
        this.getIdentity = params.getIdentity;
        this.getIdentityTeam = params.getIdentityTeam;
        this.listPermissions = params.listPermissions;
        this.listAllFoldersCallback = params.listAllFolders;
        this.canUseTeams = params.canUseTeams;
        this.canUseFolderLevelPermissions = params.canUseFolderLevelPermissions;
    }

    async listAllFolders(folderType: string): Promise<Folder[]> {
        if (folderType in this.allFolders) {
            return structuredClone(this.allFolders[folderType]);
        }

        this.allFolders[folderType] = await this.listAllFoldersCallback(folderType);
        return structuredClone(this.allFolders[folderType]);
    }

    async listAllFoldersWithPermissions(folderType: string) {
        const folders = await this.listAllFolders(folderType);

        // Filter folders based on permissions and assign permissions to each folder.
        const filteredFoldersWithPermissions = await this.filterFolders({
            folders,
            rwd: "r"
        });

        await this.assignFolderPermissions(filteredFoldersWithPermissions);

        return filteredFoldersWithPermissions;
    }

    invalidateCache(folderType?: string) {
        if (folderType) {
            if (folderType in this.allFolders) {
                delete this.allFolders[folderType];
            }
        } else {
            this.allFolders = {};
        }
    }

    async listFoldersPermissions(
        params: ListFolderPermissionsParams
    ): Promise<FolderPermissionsList> {
        if (!this.canUseFolderLevelPermissions()) {
            return [];
        }

        const { folderType, foldersList } = params;

        const allFolders = foldersList || (await this.listAllFolders(folderType));
        const identity = this.getIdentity();
        const permissions = await this.listPermissions();

        let identityTeam: Team | null;
        if (this.canUseTeams()) {
            identityTeam = await this.getIdentityTeam();
        }

        const processedFolderPermissions: FolderPermissionsListItem[] = [];

        const processFolderPermissions = (folder: Folder) => {
            if (processedFolderPermissions.some(fp => fp.folderId === folder.id)) {
                return;
            }

            // Copy permissions, so we don't modify the original object.
            const currentFolderPermissions: FolderPermissionsListItem = {
                folderId: folder.id,
                // On new folders, permissions can be `null`. Guard against that.
                permissions: folder.permissions?.map(permission => ({ ...permission })) || []
            };

            // Check for permissions inherited from parent folder.
            if (folder.parentId) {
                const parentFolder = allFolders!.find(f => f.id === folder.parentId)!;
                if (parentFolder) {
                    // First check if the parent folder has already been processed.
                    let processedParentFolderPermissions = processedFolderPermissions.find(
                        fp => fp.folderId === parentFolder.id
                    );

                    // If not, process the parent folder.
                    if (!processedParentFolderPermissions) {
                        processFolderPermissions(parentFolder);
                        processedParentFolderPermissions = processedFolderPermissions.find(
                            fp => fp.folderId === folder.parentId
                        );
                    }

                    // If the parent folder has permissions, let's add them to the current folder.
                    if (processedParentFolderPermissions) {
                        const isPublicParentFolder =
                            processedParentFolderPermissions.permissions.some(
                                p => p.level === "public"
                            );

                        // We inherit parent permissions if:
                        // 1. the parent folder is not public or...
                        // 2. ...the parent folder is public, but the current folder doesn't have any permissions set
                        const mustInherit =
                            !isPublicParentFolder ||
                            currentFolderPermissions.permissions.length === 0;

                        if (mustInherit) {
                            const inheritedPermissions =
                                processedParentFolderPermissions.permissions.map(p => {
                                    return {
                                        ...p,
                                        inheritedFrom:
                                            "parent:" + processedParentFolderPermissions!.folderId
                                    };
                                });

                            currentFolderPermissions.permissions.push(...inheritedPermissions);
                        }
                    }
                }
            }

            // Let's ensure current identity's permission is included in the permissions array.
            // We first check if the current identity is already included in the permissions array.
            // If not, we check if the user has full access or if the team user belongs to has access.
            const currentIdentityIncludedInPermissions = currentFolderPermissions.permissions.some(
                p => p.target === `admin:${identity.id}`
            );

            if (currentIdentityIncludedInPermissions) {
                // Ensure existing identity permission is always the first one in the array.
                const currentIdentityPermissionIndex =
                    currentFolderPermissions.permissions.findIndex(
                        p => p.target === `admin:${identity.id}`
                    );

                if (currentIdentityPermissionIndex > 0) {
                    const [currentIdentityPermission] = currentFolderPermissions.permissions.splice(
                        currentIdentityPermissionIndex,
                        1
                    );
                    currentFolderPermissions.permissions.unshift(currentIdentityPermission);
                }
            } else {
                // Current identity not included in permissions? Let's add it.
                let currentIdentityPermission: FolderPermission | null = null;

                // 1. Check if the user has full access.
                const hasFullAccess = permissions.some(p => p.name === "*");
                if (hasFullAccess) {
                    currentIdentityPermission = {
                        target: `admin:${identity.id}`,
                        level: "owner",
                        inheritedFrom: "role:full-access"
                    };
                } else if (identityTeam) {
                    // 2. Check the team user belongs to grants access to the folder.
                    const teamPermission = currentFolderPermissions.permissions.find(
                        p => p.target === `team:${identityTeam!.id}`
                    );

                    if (teamPermission) {
                        currentIdentityPermission = {
                            target: `admin:${identity.id}`,
                            level: teamPermission.level,
                            inheritedFrom: "team:" + identityTeam!.id
                        };
                    }
                }

                if (currentIdentityPermission) {
                    // If permission is found, let's add it to the beginning of the array.
                    // We're doing this just because it looks nicer in the UI.
                    currentFolderPermissions.permissions.unshift(currentIdentityPermission);
                }
            }

            // Note that this can only happen with root folders. All other (child) folders will
            // always have at least one permission (inherited from parent).
            const mustAddPublicPermission = currentFolderPermissions.permissions.length === 0;
            if (mustAddPublicPermission) {
                currentFolderPermissions.permissions = [
                    {
                        target: `admin:${identity.id}`,
                        level: "public",
                        inheritedFrom: "public"
                    }
                ];
            }

            processedFolderPermissions.push(currentFolderPermissions);
        };

        for (let i = 0; i < allFolders!.length; i++) {
            const folder = allFolders![i];
            processFolderPermissions(folder);
        }

        return processedFolderPermissions;
    }

    async getFolderPermissions(
        params: GetFolderPermissionsParams
    ): Promise<FolderPermissionsListItem | undefined> {
        const { folder, foldersList } = params;
        const folderPermissionsList = await this.listFoldersPermissions({
            folderType: folder.type,
            foldersList
        });

        return folderPermissionsList.find(fp => fp.folderId === folder.id);
    }

    async canAccessFolder(params: CanAccessFolderParams) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        if (params.managePermissions && params.rwd !== "w") {
            throw new Error(`Cannot check for "managePermissions" access without "w" access.`);
        }

        const { folder } = params;

        // We check for parent folder access first because the passed folder should be
        // inaccessible if the parent folder is inaccessible.
        if (folder.parentId) {
            let foldersList = params.foldersList;
            if (!foldersList) {
                foldersList = await this.listAllFolders(folder.type);
            }

            const parentFolder = foldersList.find(f => f.id === folder.parentId);
            if (parentFolder) {
                const canAccessParentFolder = await this.canAccessFolder({
                    ...params,
                    folder: parentFolder
                });

                if (!canAccessParentFolder) {
                    return false;
                }
            }
        }

        const folderPermissions = await this.getFolderPermissions({
            folder,
            foldersList: params.foldersList
        });

        // If dealing with a public folder, we only care if we're checking for "managePermissions" access.
        // If we are, we can return false, because public folders cannot have permissions managed.
        const isPublicFolder = folderPermissions?.permissions.some(p => p.level === "public");
        if (isPublicFolder) {
            return !params.managePermissions;
        }

        const identity = this.getIdentity();

        const userAccessLevel = folderPermissions?.permissions.find(
            p => p.target === "admin:" + identity.id
        )?.level;

        let teamAccessLevel: FolderAccessLevel | undefined;

        if (this.canUseTeams()) {
            const identityTeam = await this.getIdentityTeam();
            if (identityTeam) {
                teamAccessLevel = folderPermissions?.permissions.find(
                    p => p.target === "team:" + identityTeam.id
                )?.level;
            }
        }

        const accessLevels = [userAccessLevel, teamAccessLevel].filter(Boolean);

        if (params.rwd !== "r") {
            return accessLevels.includes("owner");
        }

        // If we are here, it means we are checking for "read" access.
        // For starters, let's check if the user has any access level.
        if (accessLevels.length > 0) {
            return true;
        }

        // No conditions were met, so we can return false.
        return false;
    }

    async ensureCanAccessFolder(params: CanAccessFolderParams) {
        const canAccessFolder = await this.canAccessFolder(params);
        if (!canAccessFolder) {
            throw new NotAuthorizedError();
        }
    }

    canManageFolderPermissions(folder: Folder) {
        if (!this.canUseFolderLevelPermissions()) {
            return false;
        }

        return this.canAccessFolder({ folder, rwd: "w", managePermissions: true });
    }

    canManageFolderStructure(folder: Folder) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        return this.canAccessFolder({ folder, rwd: "w" });
    }

    async canAccessFolderContent(params: CanAccessFolderContentParams) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const { folder, foldersList } = params;

        const folderPermissions = await this.getFolderPermissions({
            folder,
            foldersList
        });

        // If dealing with a public folder, that means we can access its content.
        const isPublicFolder = folderPermissions?.permissions.some(p => p.level === "public");
        if (isPublicFolder) {
            return true;
        }

        const identity = this.getIdentity();

        const userAccessLevel = folderPermissions?.permissions.find(
            p => p.target === "admin:" + identity.id
        )?.level;

        let teamAccessLevel: FolderAccessLevel | undefined;
        if (this.canUseTeams()) {
            const identityTeam = await this.getIdentityTeam();
            if (identityTeam) {
                teamAccessLevel = folderPermissions?.permissions.find(
                    p => p.target === "team:" + identityTeam.id
                )?.level;
            }
        }

        const accessLevels = [userAccessLevel, teamAccessLevel].filter(Boolean);

        // If the user is not an owner and we're checking for "write" or
        // "delete" access, then we can immediately return false.
        if (params.rwd !== "r") {
            return accessLevels.includes("owner") || accessLevels.includes("editor");
        }

        // If we are here, it means we are checking for "read" access.
        // For starters, let's check if the user has any access level.
        if (accessLevels.length > 0) {
            return true;
        }

        // No conditions were met, so we can return false.
        return false;
    }

    async ensureCanAccessFolderContent(params: CanAccessFolderContentParams) {
        const canAccessFolderContent = await this.canAccessFolderContent(params);
        if (!canAccessFolderContent) {
            throw new NotAuthorizedError();
        }
    }

    async canCreateFolderInRoot() {
        return true;
    }

    async filterFolders(params: FilterFoldersParams) {
        const filteredFolders: Folder[] = [];

        const { folders, rwd } = params;
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const canAccessFolder = await this.canAccessFolder({ folder, rwd });
            if (canAccessFolder) {
                filteredFolders.push(folder);
            }
        }

        return filteredFolders;
    }

    async assignFolderPermissions(folder: Folder | Folder[]) {
        const folders = Array.isArray(folder) ? folder : [folder];

        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const folderPermissions = await this.getFolderPermissions({ folder });
            if (folderPermissions) {
                folder.permissions = folderPermissions.permissions;
            } else {
                folder.permissions = [];
            }
        }
    }

    permissionsIncludeNonInheritedPermissions(folderPermissionsList?: FolderPermission[]) {
        return folderPermissionsList?.some(p => !p.inheritedFrom);
    }
}
