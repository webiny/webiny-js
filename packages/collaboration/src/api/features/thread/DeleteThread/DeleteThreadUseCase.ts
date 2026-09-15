import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DeleteThreadUseCase as UseCase } from "./abstractions.js";
import { GetThreadUseCase } from "~/api/features/thread/GetThread/index.js";
import {
    CollabThreadNotAuthorizedError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";

class DeleteThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getThread: GetThreadUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface
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

        const modelResult = await this.getModel.execute(COLLAB_THREAD_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(modelResult.error));
        }

        const revisionId = createIdentifier({ id: thread.id, version: 1 });
        const deleteResult = await this.deleteEntry.execute(modelResult.value, revisionId, {
            permanently: true
        });

        if (deleteResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(deleteResult.error));
        }

        return Result.ok(true);
    }
}

export const DeleteThreadUseCase = UseCase.createImplementation({
    implementation: DeleteThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadUseCase, DeleteEntryUseCase, GetModelUseCase]
});
