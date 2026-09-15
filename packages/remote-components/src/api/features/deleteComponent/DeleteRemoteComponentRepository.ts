import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { DeleteEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteRemoteComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";

class DeleteRemoteComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly deleteEntryRepository: DeleteEntryRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(REMOTE_COMPONENT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new RemoteComponentNotFoundError(REMOTE_COMPONENT_MODEL_ID));
            }

            const entryResult = await this.getLatestRevisionRepository.execute(modelResult.value, {
                id
            });

            if (entryResult.isFail()) {
                return Result.fail(new RemoteComponentNotFoundError(id));
            }

            const deleteResult = await this.deleteEntryRepository.execute(
                modelResult.value,
                entryResult.value
            );

            if (deleteResult.isFail()) {
                return Result.fail(new RemoteComponentPersistenceError(deleteResult.error));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new RemoteComponentPersistenceError(error as Error));
        }
    }
}

export const DeleteRemoteComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteRemoteComponentRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository, DeleteEntryRepository]
});
