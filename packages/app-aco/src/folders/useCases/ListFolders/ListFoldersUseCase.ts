import { IListFoldersRepository } from "~/folders/repositories";
import { IListFoldersUseCase, ListFoldersParams } from "./IListFoldersUseCase";

export class ListFoldersUseCase implements IListFoldersUseCase {
    private repository: IListFoldersRepository;

    constructor(repository: IListFoldersRepository) {
        this.repository = repository;
    }

    async execute(params: ListFoldersParams) {
        await this.repository.execute(params.type);
    }
}
