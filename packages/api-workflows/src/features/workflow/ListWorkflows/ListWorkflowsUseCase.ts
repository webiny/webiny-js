import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListWorkflowsRepository, ListWorkflowsUseCase as UseCase } from "./abstractions.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ListWorkflowsRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        /* Workflows can't be listed anonymously. Background work (tasks, scheduler) runs
           without authorization and keeps access. */
        if (
            this.identityContext.isAuthorizationEnabled() &&
            this.identityContext.getIdentity().isAnonymous()
        ) {
            return Result.fail(
                new WorkflowNotAuthorizedError("You do not have access to workflows.")
            );
        }

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [IdentityContext, ListWorkflowsRepository]
});
