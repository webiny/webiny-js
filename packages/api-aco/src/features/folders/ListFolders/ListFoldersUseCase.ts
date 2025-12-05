import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import {
    ListFoldersUseCase as UseCaseAbstraction,
    ListFoldersRepository
} from "./abstractions.js";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";

class ListFoldersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListFoldersRepository.Interface) {}

    async execute(
        params: ListFoldersParams
    ): Promise<Result<[Folder[], ListMeta], UseCaseAbstraction.Error>> {
        return await this.repository.execute(params);
    }
}

export const ListFoldersUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListFoldersUseCaseImpl,
    dependencies: [ListFoldersRepository]
});
