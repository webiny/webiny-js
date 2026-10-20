import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListAiChatsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AiChatsRepository } from "../shared/abstractions.js";
import { AiChatNotAuthenticatedError } from "../domain/errors.js";
import { AiChatValidationError } from "../domain/errors.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

class ListAiChatsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AiChatsRepository.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<UseCaseAbstraction.ListResult, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new AiChatNotAuthenticatedError());
        }

        const limit = params.limit ?? DEFAULT_LIMIT;
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
            return Result.fail(
                new AiChatValidationError(
                    `The limit must be a whole number from 1 to ${MAX_LIMIT}.`
                )
            );
        }

        return await this.repository.list(identity.id, { limit, cursor: params.after });
    }
}

export const ListAiChatsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAiChatsUseCaseImpl,
    dependencies: [IdentityContext, AiChatsRepository]
});
