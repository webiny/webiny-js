import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";

class NoFolderToDelete implements DeleteFolderUseCase.Interface {
    public async execute(): Promise<Result<void, DeleteFolderUseCase.Error>> {
        return Result.ok();
    }
}

/** `DeleteFolderUseCase` succeeds without deleting anything. */
export const registerNoFolderToDelete = (container: Container): void => {
    container.registerInstance(DeleteFolderUseCase, new NoFolderToDelete());
};
