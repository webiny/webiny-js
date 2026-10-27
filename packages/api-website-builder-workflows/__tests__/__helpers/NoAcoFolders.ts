import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { FolderNotFoundError } from "@webiny/api-aco/domain/folder/errors.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";

class NoFolder implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        return Result.fail(new FolderNotFoundError(id));
    }
}

class NoAncestors implements GetAncestorsUseCase.Interface {
    public async execute(): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        return Result.ok([]);
    }
}

/**
 * ACO is not part of this package's harness, but the folder-chain ports of both apps need its
 * folder reads whenever the engine resolves them: no folder exists and nothing has ancestors.
 * Tests that need real folders register ACO after these stand-ins (4.4 Task 11's `registerAco`).
 */
export const registerNoAcoFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new NoFolder());
    container.registerInstance(GetAncestorsUseCase, new NoAncestors());
};
