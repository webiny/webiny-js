import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CollabThreadMapper, type ICollabThreadValues } from "~/api/domain/thread/abstractions.js";
import { CollabThreadPersistenceError } from "~/api/domain/thread/errors.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";
import { CreateThreadRepository as Repository } from "./abstractions.js";

class CreateThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: CollabThreadMapper.Interface
    ) {}

    async execute(params: Repository.Params): Repository.Return {
        try {
            const modelResult = await this.getModel.execute(COLLAB_THREAD_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new CollabThreadPersistenceError(modelResult.error));
            }

            const createResult = await this.createEntry.execute<ICollabThreadValues>(
                modelResult.value,
                {
                    id: params.id,
                    values: params.values
                }
            );

            if (createResult.isFail()) {
                return Result.fail(new CollabThreadPersistenceError(createResult.error));
            }

            return Result.ok(this.mapper.fromCmsEntry(createResult.value));
        } catch (error) {
            return Result.fail(new CollabThreadPersistenceError(error as Error));
        }
    }
}

export const CreateThreadRepository = Repository.createImplementation({
    implementation: CreateThreadRepositoryImpl,
    dependencies: [CreateEntryUseCase, GetModelUseCase, CollabThreadMapper]
});
