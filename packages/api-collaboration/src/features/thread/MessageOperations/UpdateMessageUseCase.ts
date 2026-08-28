import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateMessageUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";
import {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";

class UpdateMessageUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        if (!input.body || input.body.trim().length === 0) {
            return Result.fail(new CollabThreadValidationError("Message body cannot be empty."));
        }

        const loaded = await this.getThread.execute(input.threadId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread } = loaded.value;
        const message = thread.messages.find(item => item.id === input.messageId);
        if (!message || message.deleted) {
            return Result.fail(
                new CollabMessageNotFoundError({
                    threadId: input.threadId,
                    messageId: input.messageId
                })
            );
        }

        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin() && identity.id !== message.createdBy.id) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You can only edit your own messages.")
            );
        }

        message.body = input.body;

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(message);
    }
}

export const UpdateMessageUseCase = UseCase.createImplementation({
    implementation: UpdateMessageUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository]
});
