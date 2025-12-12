import { Folder } from "~/domain/folder/Folder.js";
import {
    CreateFolderUseCase as UseCaseAbstraction,
    CreateFolderRepository
} from "./abstractions.js";

class CreateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateFolderRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(
            Folder.create({
                title: params.title,
                slug: params.slug,
                type: params.type,
                parentId: params.parentId,
                permissions: params.permissions,
                extensions: params.extensions
            })
        );
    }
}

export const CreateFolderUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateFolderUseCaseImpl,
    dependencies: [CreateFolderRepository]
});
