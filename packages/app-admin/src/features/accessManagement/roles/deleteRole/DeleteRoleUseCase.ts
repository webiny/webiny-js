import { DeleteRoleUseCase as UseCaseAbstraction, DeleteRoleRepository } from "./abstractions.js";

class DeleteRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteRoleRepository.Interface) {}

    async execute(id: string): Promise<void> {
        return this.repository.execute(id);
    }
}

export const DeleteRoleUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteRoleUseCaseImpl,
    dependencies: [DeleteRoleRepository]
});
