import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetRemoteComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";
import { mapEntryToDto } from "~/api/features/shared/mapEntryToDto.js";

class GetRemoteComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<any, RepositoryAbstraction.Error>> {
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

            return Result.ok(mapEntryToDto(entryResult.value));
        } catch (error) {
            return Result.fail(new RemoteComponentPersistenceError(error as Error));
        }
    }
}

export const GetRemoteComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: GetRemoteComponentRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository]
});
