import { IGetCanManageContentUseCase } from "./IGetCanManageContentUseCase";
import { IGetCanManageContentRepository } from "./IGetCanManageContentRepository";

export class GetCanManageContentWithFlpUseCase implements IGetCanManageContentUseCase {
    private repository: IGetCanManageContentRepository;
    private canUseFolderLevelPermissions: () => boolean;

    constructor(
        repository: IGetCanManageContentRepository,
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
