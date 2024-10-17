import { IListFoldersUseCase, ListFoldersParams } from "./IListFoldersUseCase";
import { IListFoldersRepository } from "./IListFoldersRepository";

export class ListFoldersUseCase implements IListFoldersUseCase {
    private repository: IListFoldersRepository;

    constructor(repository: IListFoldersRepository) {
        this.repository = repository;
    }

    async execute(params: ListFoldersParams) {
        await this.repository.execute(params.type);
    }
}
