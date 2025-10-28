import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GroupsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Group, GetGroupInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class GetGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    private repository: GroupsRepository.Interface;
    private identityContext: IdentityContext.Interface;

    constructor(
        repository: GroupsRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(params: GetGroupInput): Promise<Result<Group, UseCaseAbstraction.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.group");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.repository.get(params);
    }
}

export const GetGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetGroupUseCaseImpl,
    dependencies: [GroupsRepository, IdentityContext]
});
