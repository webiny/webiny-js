import { UpdateFolderUseCase as UseCaseAbstraction } from "../abstractions.js";

class UpdateFolderUseCaseWithoutInheritedPermissionsImpl implements UseCaseAbstraction.Interface {
    constructor(private decoratee: UseCaseAbstraction.Interface) {}

    async execute(folder: UseCaseAbstraction.Params) {
        // We must omit all inherited permissions, and all code-defined ones — those are contributed
        // by an `FlpFactory` on the API side and the API rejects them on write.
        const filteredPermissions = folder.permissions.filter(p => !p.inheritedFrom && !p.plugin);

        await this.decoratee.execute({
            ...folder,
            permissions: filteredPermissions
        });
    }
}

export const UpdateFolderUseCaseWithoutInheritedPermissions = UseCaseAbstraction.createDecorator({
    decorator: UpdateFolderUseCaseWithoutInheritedPermissionsImpl,
    dependencies: []
});
