import { createImplementation } from "@webiny/feature/api";
import { ListFoldersUseCase as UseCaseAbstraction, ListFoldersRepository } from "./abstractions.js";
import type { ListFoldersParams } from "~/folder/folder.types.js";

class ListFoldersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListFoldersRepository.Interface) {}

    async execute(params: ListFoldersParams): UseCaseAbstraction.Return {
        return await this.repository.execute(params);
    }
}

export const ListFoldersUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListFoldersUseCaseImpl,
    dependencies: [ListFoldersRepository]
});
