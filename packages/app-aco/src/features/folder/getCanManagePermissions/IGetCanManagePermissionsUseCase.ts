export interface IGetCanManagePermissionsUseCase {
    execute: (id: string) => boolean;
}
