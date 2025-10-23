import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListTeams } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Team, ListTeamsInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class ListTeamsUseCase {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: TeamsRepository.Interface
    ) {}

    async execute(params: ListTeamsInput = {}): Promise<Result<Team[], ListTeams.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.team");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.repository.list(params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListTeamsUseCaseImpl = createImplementation({
    abstraction: ListTeams,
    implementation: ListTeamsUseCase,
    dependencies: [IdentityContext, TeamsRepository]
});
