import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { mdbid } from "@webiny/utils";
import type { ModelMessage } from "ai";
import { SaveAiChatUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AiChatsRepository } from "../shared/abstractions.js";
import { AiChatNotAuthenticatedError } from "../domain/errors.js";
import { AiChatNotFoundError } from "../domain/errors.js";
import { AiChatValidationError } from "../domain/errors.js";
import { deriveChatTitle } from "../domain/deriveChatTitle.js";
import { isValidChatId } from "../domain/isValidChatId.js";
import { saveAiChatValidation } from "./schema.js";
import type { AiChat } from "../domain/types.js";

class SaveAiChatUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AiChatsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<AiChat, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new AiChatNotAuthenticatedError());
        }

        const validation = saveAiChatValidation.safeParse(input);
        if (!validation.success) {
            const [issue] = validation.error.issues;
            const path = issue.path.join(".");
            return Result.fail(new AiChatValidationError(`${path}: ${issue.message}`));
        }

        const { id, title } = validation.data;
        // The schema checks only the shape the store relies on; the rest is the client's verbatim.
        const messages = validation.data.messages as ModelMessage[];
        const now = new Date().toISOString();

        if (id === undefined) {
            const chat: AiChat = {
                // Starts with the creation time, which is what orders the list newest first.
                id: mdbid(),
                title: title ?? deriveChatTitle(messages),
                createdOn: now,
                savedOn: now,
                messages
            };
            return await this.repository.save(identity.id, chat);
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

        const chat: AiChat = {
            id,
            title: title ?? existing.value.title,
            createdOn: existing.value.createdOn,
            savedOn: now,
            messages
        };
        return await this.repository.save(identity.id, chat);
    }
}

export const SaveAiChatUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveAiChatUseCaseImpl,
    dependencies: [IdentityContext, AiChatsRepository]
});
