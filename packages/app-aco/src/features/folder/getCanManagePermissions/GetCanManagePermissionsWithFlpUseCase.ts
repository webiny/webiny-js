import { IGetCanManagePermissionsUseCase } from "./IGetCanManagePermissionsUseCase";
import { IGetCanManagePermissionsRepository } from "./IGetCanManagePermissionsRepository";

export class GetCanManagePermissionsWithFlpUseCase implements IGetCanManagePermissionsUseCase {
    private repository: IGetCanManagePermissionsRepository;
    private canUseFolderLevelPermissions: () => boolean;

    constructor(
        repository: IGetCanManagePermissionsRepository,
        canUseFolderLevelPermissions: () => boolean
    ) {
        this.repository = repository;
        this.canUseFolderLevelPermissions = canUseFolderLevelPermissions;
    }

    execute(id: string) {
        if (!this.canUseFolderLevelPermissions) {
            return true;
        }

        return this.repository.execute(id);
    }
}
