import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CollabThreadPersistenceError } from "~/api/domain/thread/errors.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";
import { DeleteThreadRepository as Repository } from "./abstractions.js";

class DeleteThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    async execute(id: string): Repository.Return {
        try {
            const modelResult = await this.getModel.execute(COLLAB_THREAD_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new CollabThreadPersistenceError(modelResult.error));
            }

            const revisionId = createIdentifier({ id, version: 1 });
            const deleteResult = await this.deleteEntry.execute(modelResult.value, revisionId, {
                permanently: true
            });

            if (deleteResult.isFail()) {
                return Result.fail(new CollabThreadPersistenceError(deleteResult.error));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new CollabThreadPersistenceError(error as Error));
        }
    }
}

export const DeleteThreadRepository = Repository.createImplementation({
    implementation: DeleteThreadRepositoryImpl,
    dependencies: [DeleteEntryUseCase, GetModelUseCase]
});
