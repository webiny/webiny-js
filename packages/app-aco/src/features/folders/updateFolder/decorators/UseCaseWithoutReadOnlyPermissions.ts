import { UpdateFolderUseCase as UseCaseAbstraction } from "../abstractions.js";

class UpdateFolderUseCaseWithoutReadOnlyPermissionsImpl implements UseCaseAbstraction.Interface {
    constructor(private decoratee: UseCaseAbstraction.Interface) {}

    async execute(folder: UseCaseAbstraction.Params) {
        // Some permissions are read-only: inherited ones are contributed by a parent folder, and
        // code-defined ones by an `FlpFactory` on the API side. Neither is stored on the folder
        // itself, and the API rejects them on write, so we must omit them.
        const filteredPermissions = folder.permissions.filter(p => !p.inheritedFrom && !p.plugin);

        await this.decoratee.execute({
            ...folder,
            permissions: filteredPermissions
        });
    }
}

export const UpdateFolderUseCaseWithoutReadOnlyPermissions = UseCaseAbstraction.createDecorator({
    decorator: UpdateFolderUseCaseWithoutReadOnlyPermissionsImpl,
    dependencies: []
});
