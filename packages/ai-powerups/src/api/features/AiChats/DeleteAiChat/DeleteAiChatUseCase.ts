import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteAiChatUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AiChatsRepository } from "../shared/abstractions.js";
import { AiChatNotAuthenticatedError } from "../domain/errors.js";
import { AiChatNotFoundError } from "../domain/errors.js";
import { isValidChatId } from "../domain/isValidChatId.js";

class DeleteAiChatUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AiChatsRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new AiChatNotAuthenticatedError());
        }

        if (!isValidChatId(id)) {
            return Result.fail(new AiChatNotFoundError(id));
        }

        const existing = await this.repository.get(identity.id, id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        if (!existing.value) {
            return Result.fail(new AiChatNotFoundError(id));
        }

        return await this.repository.delete(identity.id, id);
    }
}

export const DeleteAiChatUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteAiChatUseCaseImpl,
    dependencies: [IdentityContext, AiChatsRepository]
});
