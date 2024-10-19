import { IGetCanManagePermissionsUseCase } from "./IGetCanManagePermissionsUseCase";
import { IGetCanManagePermissionsRepository } from "./IGetCanManagePermissionsRepository";

export class GetCanManagePermissionsWithFlpUseCase implements IGetCanManagePermissionsUseCase {
    private repository: IGetCanManagePermissionsRepository;

    constructor(repository: IGetCanManagePermissionsRepository) {
        this.repository = repository;
    }

    execute(id: string) {
        return this.repository.execute(id);
    }
}
