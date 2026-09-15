import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteMessageUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/api/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/api/features/thread/UpdateThread/index.js";
import {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError
} from "~/api/domain/thread/errors.js";

class DeleteMessageUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.getThread.execute(input.threadId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread } = loaded.value;
        const messageIndex = thread.messages.findIndex(item => item.id === input.messageId);
        if (messageIndex === -1) {
            return Result.fail(
                new CollabMessageNotFoundError({
                    threadId: input.threadId,
                    messageId: input.messageId
                })
            );
        }

        const identity = this.identityContext.getIdentity();
        const message = thread.messages[messageIndex];

        if (identity.id !== message.createdBy.id) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You can only delete your own messages.")
            );
        }

        thread.messages = thread.messages.filter(item => item.id !== input.messageId);

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(true);
    }
}

export const DeleteMessageUseCase = UseCase.createImplementation({
    implementation: DeleteMessageUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository]
});
