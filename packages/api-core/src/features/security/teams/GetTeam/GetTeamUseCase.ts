import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetTeam } from "./abstractions.js";
import { TeamsRepository } from "../shared/abstractions.js";
import { IdentityContext } from "../../IdentityContext/abstractions.js";
import type { Team, GetTeamInput } from "../shared/types.js";
import { NotAuthorizedError } from "../shared/errors.js";

export class GetTeamUseCase {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: TeamsRepository.Interface
    ) {}

    async execute(params: GetTeamInput): Promise<Result<Team, GetTeam.Error>> {
        const hasPermission = await this.identityContext.getPermission("security.team");

        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.repository.get(params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetTeamUseCaseImpl = createImplementation({
    abstraction: GetTeam,
    implementation: GetTeamUseCase,
    dependencies: [IdentityContext, TeamsRepository]
});
