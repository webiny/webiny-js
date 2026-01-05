import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListRolesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RolesRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Role, ListRolesInput } from "../shared/types.js";
import { NotAuthorizedError } from "~/features/security/roles/shared/errors.js";

class ListRolesUseCaseImpl implements UseCaseAbstraction.Interface {
    private repository: RolesRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(repository: RolesRepository.Interface, identityContext: IdentityContext.Interface) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: ListRolesInput = {}): Promise<Result<Role[], UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.role");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.list(params);
    }
}

export const ListRolesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListRolesUseCaseImpl,
    dependencies: [RolesRepository, IdentityContext]
});
