import type { Role } from "../../types.js";
import {
    CreateRoleUseCase as UseCaseAbstraction,
    CreateRoleRepository,
    type ICreateRoleData
} from "./abstractions.js";

class CreateRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateRoleRepository.Interface) {}

    async execute(data: ICreateRoleData): Promise<Role> {
        return this.repository.execute(data);
    }
}

export const CreateRoleUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRoleUseCaseImpl,
    dependencies: [CreateRoleRepository]
});
