import type { Role } from "../../types.js";
import { GetRoleUseCase as UseCaseAbstraction, GetRoleRepository } from "./abstractions.js";

class GetRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetRoleRepository.Interface) {}

    async execute(id: string): Promise<Role> {
        return this.repository.execute(id);
    }
}

export const GetRoleUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRoleUseCaseImpl,
    dependencies: [GetRoleRepository]
});
