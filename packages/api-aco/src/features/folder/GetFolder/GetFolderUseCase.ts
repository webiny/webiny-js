import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetFolderUseCase as UseCaseAbstraction, GetFolderRepository } from "./abstractions.js";
import type { Folder } from "~/folder/folder.types.js";

class GetFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFolderRepository.Interface) {}

    async execute(id: string): Promise<Result<Folder, UseCaseAbstraction.Error>> {
        return this.repository.execute(id);
    }
}

export const GetFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetFolderUseCaseImpl,
    dependencies: [GetFolderRepository]
});
