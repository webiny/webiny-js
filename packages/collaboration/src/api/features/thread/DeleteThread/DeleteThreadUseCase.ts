import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteThreadRepository, DeleteThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/api/features/thread/GetThread/index.js";
import { CollabThreadNotAuthorizedError } from "~/api/domain/thread/errors.js";

class DeleteThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private repository: DeleteThreadRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const loaded = await this.getThread.execute(id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread } = loaded.value;

        const identity = this.identityContext.getIdentity();
        if (identity.id !== thread.createdBy.id) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You can only delete your own threads.")
            );
        }

        const deleteResult = await this.repository.execute(thread.id);
        if (deleteResult.isFail()) {
            return Result.fail(deleteResult.error);
        }

        return Result.ok(true);
    }
}

export const DeleteThreadUseCase = UseCase.createImplementation({
    implementation: DeleteThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, DeleteThreadRepository]
});
