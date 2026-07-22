import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteMessageUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";
import {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError
} from "~/domain/thread/errors.js";
import { toCollabIdentity } from "~/utils/identity.js";

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
                new CollabThreadNotAuthorizedError("You can only delete your own messages.")
            );
        }

        message.deleted = true;
        message.deletedBy = toCollabIdentity(identity);
        message.deletedOn = new Date().toISOString();

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
