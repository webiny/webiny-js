import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { ListWorkflowStatesUseCase } from "../ListWorkflowStates/index.js";
import { ListRequestedWorkflowStatesUseCase as UseCase } from "./abstractions.js";

class ListRequestedWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private listWorkflowStates: ListWorkflowStatesUseCase.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);

        if (teamsResult.isFail() || teamsResult.value.length === 0 || !identity?.id) {
            return Result.ok({
                items: [],
                meta: {
                    cursor: null,
                    hasMoreItems: false,
                    totalCount: 0
                }
            });
        }

        const teams = teamsResult.value;

        return await this.listWorkflowStates.execute({
            ...params,
            where: {
                ...params?.where,
                createdBy_not: identity.id,
                values: {
                    ...params?.where?.values,
                    isActive: true,
                    steps: {
                        teams: {
                            id_in: teams.map(team => team.id)
                        }
                    }
                }
            }
        });
    }
}

export const ListRequestedWorkflowStatesUseCase = UseCase.createImplementation({
    implementation: ListRequestedWorkflowStatesUseCaseImpl,
    dependencies: [IdentityContext, GetUserTeamsUseCase, ListWorkflowStatesUseCase]
});
