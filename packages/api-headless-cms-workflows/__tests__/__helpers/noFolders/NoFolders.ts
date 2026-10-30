import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListFoldersUseCase } from "@webiny/api-aco/features/folder/ListFolders/index.js";

/** No ACO folders exist (ACO is not part of this package's harness). */
class NoFolders implements ListFoldersUseCase.Interface {
    public async execute(): ListFoldersUseCase.Return {
        return Result.ok({
            folders: [],
            meta: { cursor: null, totalCount: 0, hasMoreItems: false }
        });
    }
}

/** `ListFoldersUseCase` lists no folders. */
export const registerNoFolderList = (container: Container): void => {
    container.registerInstance(ListFoldersUseCase, new NoFolders());
};
