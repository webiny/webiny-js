import { Result } from "@webiny/feature/api";
import { ListFoldersUseCase } from "@webiny/api-aco/features/folder/ListFolders/index.js";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import type { Container } from "@webiny/di";

/** No ACO folders exist (ACO is not part of this package's harness). */
class NoFolders implements ListFoldersUseCase.Interface {
    public async execute(): ListFoldersUseCase.Return {
        return Result.ok({
            folders: [],
            meta: { cursor: null, totalCount: 0, hasMoreItems: false }
        });
    }
}

class NoFolderToDelete implements DeleteFolderUseCase.Interface {
    public async execute(): Promise<Result<void, DeleteFolderUseCase.Error>> {
        return Result.ok();
    }
}

/** Registers the folder use cases the "delete model and entries" task resolves. */
export const registerNoFolders = (container: Container) => {
    container.registerInstance(ListFoldersUseCase, new NoFolders());
    container.registerInstance(DeleteFolderUseCase, new NoFolderToDelete());
};
