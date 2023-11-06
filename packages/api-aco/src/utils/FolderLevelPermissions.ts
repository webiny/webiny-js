import { Authentication } from "@webiny/api-authentication/types";
import { SecurityPermission, Team } from "@webiny/api-security/types";
import { Folder } from "~/folder/folder.types";
import { NotAuthorizedError } from "@webiny/api-security";
import structuredClone from "@ungap/structured-clone";
import { ACO_SEARCH_RECORD_PB_PAGE, FM_FILE_FOLDER_TYPE } from "~/utils/constants";

export type FolderAccessLevel = "owner" | "viewer" | "editor";

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

export interface CanAccessFolderParams {
    folder: Pick<Folder, "id" | "type" | "parentId">;
    rwd?: "r" | "w" | "d";
    foldersList?: Folder[];
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

        const processedFolderPermissions: FolderPermissionsListItem[] = [];

        let identityTeam: Team | null;
        if (this.canUseTeams()) {
            identityTeam = await this.getIdentityTeam();
        }

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

            // Finally, let's also ensure that the current user is included in the permissions,
            // if not already. Let's also ensure the user is the first item in the array.
            const [firstPermission] = currentFolderPermissions.permissions;

            let identityFirstPermission: FolderPermission | undefined;

            // If current identity is already listed as the first permission, we don't need to do anything.
            if (firstPermission?.target === `admin:${identity.id}`) {
                identityFirstPermission = firstPermission;
            }

            if (!identityFirstPermission) {
                const currentIdentityPermissionIndex =
                    currentFolderPermissions.permissions.findIndex(
                        p => p.target === `admin:${identity.id}`
                    );

                if (currentIdentityPermissionIndex >= 0) {
                    // Move existing permission to the first position.
                    const [identityPermission] = currentFolderPermissions.permissions.splice(
                        currentIdentityPermissionIndex,
                        1
                    );
                    currentFolderPermissions.permissions.unshift(identityPermission);
                    identityFirstPermission = identityPermission;
                } else {
                    let hasFullAccess = this.hasFullAccess(permissions);

                    // If the current identity is not in the permissions, let's add it.
                    // If the user has full access, we'll add it as "owner".
                    if (!hasFullAccess) {
                        // Let's check if the user has full access set on the app level. For example,
                        // if we're working with "FmFile" folder type, we'll check for "fm.*" permission.
                        // The same goes with Page Builder pages and CMS content entries.
                        if (folder.type === FM_FILE_FOLDER_TYPE) {
                            hasFullAccess = this.hasFmFileFullAccess(permissions);
                        } else if (folder.type === ACO_SEARCH_RECORD_PB_PAGE) {
                            hasFullAccess = this.hasPbPageFullAccess(permissions);
                        } else if (folder.type.startsWith("cms:")) {
                            hasFullAccess = this.hasCmsEntryFullAccess(permissions);
                        }
                    }

                    if (hasFullAccess) {
                        identityFirstPermission = {
                            target: `admin:${identity.id}`,
                            level: "owner",
                            inheritedFrom: "role:full-access"
                        };
                        currentFolderPermissions.permissions.unshift(identityFirstPermission);
                    }
                }
            }

            // Let's check if there is a team associated with the current identity.
            if (!identityFirstPermission) {
                if (identityTeam) {
                    const teamPermission = currentFolderPermissions.permissions.find(
                        p => p.target === `team:${identityTeam!.id}`
                    );

                    if (teamPermission) {
                        identityFirstPermission = {
                            target: `admin:${identity.id}`,
                            level: teamPermission.level,
                            inheritedFrom: "team:" + identityTeam!.id
                        };

                        currentFolderPermissions.permissions.unshift(identityFirstPermission);
                    }
                }
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

        // If the user doesn't have any access level, let's check if the folder has any permissions set.
        // Folders that don't have any permissions set are considered "public".
        const hasPermissions = folderPermissions && folderPermissions.permissions.length > 0;
        if (!hasPermissions) {
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

        return this.canAccessFolder({ folder, rwd: "w" });
    }

    canManageFolderStructure(folder: Folder) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        return this.canAccessFolder({ folder, rwd: "w" });
    }

    async canAccessFolderContent(params: CanAccessFolderParams) {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const { folder, foldersList } = params;

        const folderPermissions = await this.getFolderPermissions({
            folder,
            foldersList
        });

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

        // If the user doesn't have any access level, let's check if the folder has any permissions set.
        // Folders that don't have any permissions set are considered "public".
        const hasPermissions = folderPermissions && folderPermissions.permissions.length > 0;
        if (!hasPermissions) {
            return true;
        }

        // No conditions were met, so we can return false.
        return false;
    }

    async ensureCanAccessFolderContent(params: CanAccessFolderParams) {
        const canAccessFolderContent = await this.canAccessFolderContent(params);
        if (!canAccessFolderContent) {
            throw new NotAuthorizedError();
        }
    }

    async canCreateFolderInRoot() {
        if (!this.canUseFolderLevelPermissions()) {
            return true;
        }

        const permissions = await this.listPermissions();
        return permissions.some(p => p.name === "*");
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

    private hasFullAccess(permissions: SecurityPermission[]) {
        return permissions.some(p => p.name === "*");
    }

    private hasFmFileFullAccess(permissions: SecurityPermission[]) {
        if (this.hasFullAccess(permissions)) {
            return true;
        }

        const hasFmFullAccess = permissions.some(p => p.name === "fm.*");
        if (hasFmFullAccess) {
            return true;
        }

        const fmFilePermissions = permissions.filter(p => p.name === "fm.file");
        for (const p of fmFilePermissions) {
            if (!p.own && p.rwd === "rwd") {
                return true;
            }
        }

        return false;
    }

    private hasPbPageFullAccess(permissions: SecurityPermission[]) {
        if (this.hasFullAccess(permissions)) {
            return true;
        }

        const hasPbFullAccess = permissions.some(p => p.name === "pb.*");
        if (hasPbFullAccess) {
            return true;
        }

        const pbPagePermissions = permissions.filter(p => p.name === "pb.page");
        for (const p of pbPagePermissions) {
            if (!p.own && p.rwd === "rwd") {
                return true;
            }
        }

        return false;
    }

    private hasCmsEntryFullAccess(permissions: SecurityPermission[]) {
        if (this.hasFullAccess(permissions)) {
            return true;
        }

        return permissions.some(p => p.name === "cms.*");
    }
}
