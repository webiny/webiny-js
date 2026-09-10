import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListRemoteComponentsRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    RemoteComponentNotFoundError,
    RemoteComponentPersistenceError
} from "~/api/domain/errors.js";
import { REMOTE_COMPONENT_MODEL_ID } from "~/shared/constants.js";
import { mapEntryToDto } from "~/api/features/shared/mapEntryToDto.js";

class ListRemoteComponentsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface
    ) {}

    async execute(): Promise<Result<RepositoryAbstraction.Output, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(REMOTE_COMPONENT_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new RemoteComponentNotFoundError(REMOTE_COMPONENT_MODEL_ID));
            }

            const listResult = await this.listEntriesRepository.execute(modelResult.value, {
                limit: 1000
            });

            if (listResult.isFail()) {
                return Result.fail(new RemoteComponentPersistenceError(listResult.error));
            }

            const { entries, meta } = listResult.value;

            return Result.ok({
                items: entries.map(entry => mapEntryToDto(entry)),
                meta: {
                    cursor: meta.cursor,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(new RemoteComponentPersistenceError(error as Error));
        }
    }
}

export const ListRemoteComponentsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRemoteComponentsRepositoryImpl,
    dependencies: [GetModelRepository, ListEntriesRepository]
});
