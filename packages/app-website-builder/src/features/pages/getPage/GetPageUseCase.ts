import type { GetPageParams, IGetPageUseCase } from "./IGetPageUseCase.js";
import type { IGetPageRepository } from "./IGetPageRepository.js";

export class GetPageUseCase implements IGetPageUseCase {
    private repository: IGetPageRepository;

    constructor(repository: IGetPageRepository) {
        this.repository = repository;
    }

    async execute(params: GetPageParams) {
        await this.repository.execute(params.id);
    }
}
