import { IGetCanManageContentUseCase } from "./IGetCanManageContentUseCase";
import { IGetCanManageContentRepository } from "./IGetCanManageContentRepository";

export class GetCanManageContentWithFlpUseCase implements IGetCanManageContentUseCase {
    private repository: IGetCanManageContentRepository;

    constructor(repository: IGetCanManageContentRepository) {
        this.repository = repository;
    }

    execute(id: string) {
        return this.repository.execute(id);
    }
}
