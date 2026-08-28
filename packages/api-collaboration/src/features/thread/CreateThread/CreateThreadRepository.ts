import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import {
    CollabThreadMapper,
    CollabThreadModel,
    type ICollabThreadValues
} from "~/domain/thread/abstractions.js";
import { CollabThreadPersistenceError } from "~/domain/thread/errors.js";
import { CreateThreadRepository as Repository } from "./abstractions.js";

class CreateThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private model: CollabThreadModel.Interface,
        private mapper: CollabThreadMapper.Interface
    ) {}

    async execute(params: Repository.Params): Repository.Return {
        try {
            const createResult = await this.createEntry.execute<ICollabThreadValues>(this.model, {
                id: params.id,
                values: params.values
            });

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
    dependencies: [CreateEntryUseCase, CollabThreadModel, CollabThreadMapper]
});
