import { IListPagesUseCase, type ListPagesUseCaseParams } from "./IListPagesUseCase.js";
import { IListPagesRepository } from "./IListPagesRepository.js";

export class ListPagesUseCase implements IListPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(params?: ListPagesUseCaseParams) {
        await this.repository.execute(params);
    }
}
