import { IGetFolderLevelPermissionUseCase } from "./IGetFolderLevelPermissionUseCase";
import { IGetFolderLevelPermissionRepository } from "./IGetFolderLevelPermissionRepository";

export class GetFolderLevelPermissionWithFlpUseCase implements IGetFolderLevelPermissionUseCase {
    private repository: IGetFolderLevelPermissionRepository;

    constructor(repository: IGetFolderLevelPermissionRepository) {
        this.repository = repository;
    }

    execute(id: string) {
        return this.repository.execute(id);
    }
}
