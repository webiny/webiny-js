import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/features/thread/GetThread/index.js";
import { UpdateThreadRepository } from "~/features/thread/UpdateThread/index.js";
import { CollabThreadNotAuthorizedError } from "~/domain/thread/errors.js";
import { toCollabIdentity } from "~/utils/identity.js";

class DeleteThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private updateThread: UpdateThreadRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const loaded = await this.getThread.execute(id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        const { thread } = loaded.value;

        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin() && identity.id !== thread.createdBy.id) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You can only delete your own threads.")
            );
        }

        thread.deleted = true;
        thread.deletedBy = toCollabIdentity(identity);
        thread.deletedOn = new Date().toISOString();

        const updateResult = await this.updateThread.execute(thread);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        return Result.ok(true);
    }
}

export const DeleteThreadUseCase = UseCase.createImplementation({
    implementation: DeleteThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, UpdateThreadRepository]
});
