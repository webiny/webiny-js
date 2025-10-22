import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetGroup } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Group, GetGroupInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class GetGroupUseCase {
    private repository: GroupsRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: GroupsRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: GetGroupInput): Promise<Result<Group, Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.get(params);
    }
}

export const GetGroupUseCaseImpl = createImplementation({
    abstraction: GetGroup,
    implementation: GetGroupUseCase,
    dependencies: [GroupsRepository, IdentityContext]
});
