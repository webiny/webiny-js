export interface IGetFolderLevelPermissionUseCase {
    execute: (id: string) => boolean;
}
