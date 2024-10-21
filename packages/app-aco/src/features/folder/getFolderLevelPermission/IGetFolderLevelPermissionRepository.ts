export interface IGetFolderLevelPermissionRepository {
    execute: (id: string) => boolean;
}
