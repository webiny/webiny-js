import {
    FolderLevelPermissions,
    FolderLevelPermissionsParams
} from "~/utils/FolderLevelPermissions";

interface CreateTestFolderLevelPermissionsParams
    extends Omit<
        FolderLevelPermissionsParams,
        "canUseFolderLevelPermissions" | "canUseTeams" | "isAuthorizationEnabled"
    > {
    canUseTeams?: () => boolean;
    canUseFolderLevelPermissions?: () => boolean;
    isAuthorizationEnabled?: () => boolean;
}

export const createTestFolderLevelPermissions = (
    params: CreateTestFolderLevelPermissionsParams
) => {
    return new FolderLevelPermissions({
        canUseFolderLevelPermissions: () => true,
        canUseTeams: () => true,
        isAuthorizationEnabled: () => true,
        ...params
    });
};
