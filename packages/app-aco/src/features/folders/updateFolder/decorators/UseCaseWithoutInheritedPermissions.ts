import { UpdateFolderUseCase as UseCaseAbstraction } from "../abstractions.js";

class UpdateFolderUseCaseWithoutInheritedPermissionsImpl implements UseCaseAbstraction.Interface {
    constructor(private decoratee: UseCaseAbstraction.Interface) {}

    async execute(folder: UseCaseAbstraction.Params) {
        // We must omit all inherited permissions.
        const filteredPermissions = folder.permissions.filter(p => !p.inheritedFrom);

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
