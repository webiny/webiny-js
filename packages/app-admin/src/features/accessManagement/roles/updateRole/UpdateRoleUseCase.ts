import type { Role } from "../../types.js";
import {
    UpdateRoleUseCase as UseCaseAbstraction,
    UpdateRoleRepository,
    type IUpdateRoleData
} from "./abstractions.js";

class UpdateRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateRoleRepository.Interface) {}

    async execute(id: string, data: IUpdateRoleData): Promise<Role> {
        return this.repository.execute(id, data);
    }
}

export const UpdateRoleUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRoleUseCaseImpl,
    dependencies: [UpdateRoleRepository]
});
