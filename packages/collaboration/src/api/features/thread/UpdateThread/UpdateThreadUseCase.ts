import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateThreadRepository, UpdateThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/api/features/thread/GetThread/index.js";
import { CollabThreadNotAuthorizedError } from "~/api/domain/thread/errors.js";

class UpdateThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.getThread.execute(input.id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread, anchor } = loaded.value;

        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin() && identity.id !== thread.createdBy.id) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You can only update your own threads.")
            );
        }

        if (input.assigneeId !== undefined) {
            thread.assigneeId = input.assigneeId;
        }

        if (input.dueDate !== undefined) {
            thread.dueDate = input.dueDate;
        }

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok({ thread: updateResult.value, anchor });
    }
}

export const UpdateThreadUseCase = UseCase.createImplementation({
    implementation: UpdateThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository]
});
