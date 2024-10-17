import { IListFoldersUseCase } from "./IListFoldersUseCase";
import { IListFoldersRepository } from "./IListFoldersRepository";

export class ListFoldersUseCase implements IListFoldersUseCase {
    private repository: IListFoldersRepository;

    constructor(repository: IListFoldersRepository) {
        this.repository = repository;
    }

    async execute() {
        await this.repository.execute();
    }
}
