import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateRemoteComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";
import { mapEntryToDto } from "~/api/features/shared/mapEntryToDto.js";

class UpdateRemoteComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface
    ) {}

    async execute(
        id: string,
        values: Record<string, any>
    ): Promise<Result<any, RepositoryAbstraction.Error>> {
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

            const { entry } = await this.updateEntryDataFactory.create(
                modelResult.value,
                { values },
                entryResult.value
            );

            const updateResult = await this.updateEntryRepository.execute(modelResult.value, entry);

            if (updateResult.isFail()) {
                return Result.fail(new RemoteComponentPersistenceError(updateResult.error));
            }

            return Result.ok(mapEntryToDto(entry));
        } catch (error) {
            return Result.fail(new RemoteComponentPersistenceError(error as Error));
        }
    }
}

export const UpdateRemoteComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRemoteComponentRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryDataFactory,
        UpdateEntryRepository
    ]
});
