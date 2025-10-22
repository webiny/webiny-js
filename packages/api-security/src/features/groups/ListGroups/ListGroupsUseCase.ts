import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListGroups } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Group, ListGroupsInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class ListGroupsUseCase {
    private repository: GroupsRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: GroupsRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: ListGroupsInput = {}): Promise<Result<Group[], Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.list(params);
    }
}

export const ListGroupsUseCaseImpl = createImplementation({
    abstraction: ListGroups,
    implementation: ListGroupsUseCase,
    dependencies: [GroupsRepository, IdentityContext]
});
