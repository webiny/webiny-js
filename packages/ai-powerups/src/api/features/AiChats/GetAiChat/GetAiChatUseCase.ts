import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetAiChatUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AiChatsRepository } from "../shared/abstractions.js";
import { AiChatNotAuthenticatedError } from "../domain/errors.js";
import { AiChatNotFoundError } from "../domain/errors.js";
import { isValidChatId } from "../domain/isValidChatId.js";
import type { AiChat } from "../domain/types.js";

class GetAiChatUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AiChatsRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<AiChat, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new AiChatNotAuthenticatedError());
        }

        // An id that could never have been saved is simply not found.
        if (!isValidChatId(id)) {
            return Result.fail(new AiChatNotFoundError(id));
        }

        const result = await this.repository.get(identity.id, id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (!result.value) {
            return Result.fail(new AiChatNotFoundError(id));
        }
        return Result.ok(result.value);
    }
}

export const GetAiChatUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetAiChatUseCaseImpl,
    dependencies: [IdentityContext, AiChatsRepository]
});
