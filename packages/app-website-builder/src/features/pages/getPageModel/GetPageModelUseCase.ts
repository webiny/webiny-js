import { IGetPageModelRepository } from "./IGetPageModelRepository.js";
import { IGetPageModelUseCase } from "./IGetPageModelUseCase.js";

export class GetPageModelUseCase implements IGetPageModelUseCase {
    private repository: IGetPageModelRepository;

    constructor(repository: IGetPageModelRepository) {
        this.repository = repository;
    }

    async execute() {
        await this.repository.load();
    }
}
