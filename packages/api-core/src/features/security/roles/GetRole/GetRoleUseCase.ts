import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetRoleUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RolesRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Role, GetRoleInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class GetRoleUseCaseImpl implements UseCaseAbstraction.Interface {
    private repository: RolesRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: RolesRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: GetRoleInput): Promise<Result<Role, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.role");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.get(params);
    }
}

export const GetRoleUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRoleUseCaseImpl,
    dependencies: [RolesRepository, IdentityContext]
});
