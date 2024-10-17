import { IGetCanManageStructureUseCase } from "./IGetCanManageStructureUseCase";
import { IGetCanManageStructureRepository } from "./IGetCanManageStructureRepository";

export class GetCanManageStructureWithFlpUseCase implements IGetCanManageStructureUseCase {
    private repository: IGetCanManageStructureRepository;
    private canUseFolderLevelPermissions: () => boolean;

    constructor(
        repository: IGetCanManageStructureRepository,
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
