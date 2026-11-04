import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import { FolderNotFoundError } from "@webiny/api-aco/domain/folder/errors.js";

class FakeGetFolderRepository implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        return Result.fail(new FolderNotFoundError(id));
    }
}

class FakeGetAncestors implements GetAncestorsUseCase.Interface {
    public async execute(): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        return Result.ok([]);
    }
}

/** ACO is not part of the harness: the CMS folder port reads these two stand-ins. */
export const registerFakeFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new FakeGetFolderRepository());
    container.registerInstance(GetAncestorsUseCase, new FakeGetAncestors());
};
