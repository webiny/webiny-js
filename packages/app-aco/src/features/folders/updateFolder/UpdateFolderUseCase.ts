import { Folder } from "~/domain/folder/Folder.js";
import type { UpdateFolderParams } from "./abstractions.js";
import {
    UpdateFolderUseCase as UseCaseAbstraction,
    UpdateFolderRepository
} from "./abstractions.js";

class UpdateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateFolderRepository.Interface) {}

    async execute(folder: UpdateFolderParams) {
        await this.repository.execute(Folder.create(folder));
    }
}

export const UpdateFolderUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateFolderUseCaseImpl,
    dependencies: [UpdateFolderRepository]
});
