import { IGetCanManageStructureUseCase } from "./IGetCanManageStructureUseCase";
import { IGetCanManageStructureRepository } from "./IGetCanManageStructureRepository";

export class GetCanManageStructureUseCase implements IGetCanManageStructureUseCase {
    private repository: IGetCanManageStructureRepository;

    constructor(repository: IGetCanManageStructureRepository) {
        this.repository = repository;
    }

    execute(id: string) {
        return this.repository.execute(id);
    }
}
