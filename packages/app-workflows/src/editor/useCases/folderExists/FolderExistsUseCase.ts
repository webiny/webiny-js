import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { FolderExistsUseCase as UseCaseAbstraction } from "./abstractions.js";

class FolderExistsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<boolean> {
        return this.repository.folderExists(params);
    }
}

export const FolderExistsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FolderExistsUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
