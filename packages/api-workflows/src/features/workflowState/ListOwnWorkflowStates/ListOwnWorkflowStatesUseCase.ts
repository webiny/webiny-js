import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListWorkflowStatesUseCase } from "../ListWorkflowStates/index.js";
import { ListOwnWorkflowStatesUseCase as UseCase } from "./abstractions.js";

class ListOwnWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listWorkflowStates: ListWorkflowStatesUseCase.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            // Return empty result if no identity
            return Result.ok({
                items: [],
                meta: {
                    cursor: null,
                    hasMoreItems: false,
                    totalCount: 0
                }
            });
        }

        return this.listWorkflowStates.execute({
            ...params,
            where: {
                ...params?.where,
                values: {
                    ...params?.where?.values,
                    isActive: true
                },
                createdBy: identity.id
            }
        });
    }
}

export const ListOwnWorkflowStatesUseCase = UseCase.createImplementation({
    implementation: ListOwnWorkflowStatesUseCaseImpl,
    dependencies: [IdentityContext, ListWorkflowStatesUseCase]
});
