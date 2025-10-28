import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListGroupsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Group, ListGroupsInput } from "../shared/types.js";
import { NotAuthorizedError } from "~/features/groups/shared/errors.js";

class ListGroupsUseCaseImpl implements UseCaseAbstraction.Interface {
    private repository: GroupsRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: GroupsRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(
        params: ListGroupsInput = {}
    ): Promise<Result<Group[], UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.list(params);
    }
}

export const ListGroupsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListGroupsUseCaseImpl,
    dependencies: [GroupsRepository, IdentityContext]
});
