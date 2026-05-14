import { runInAction } from "mobx";
import { FilesListCache } from "../shared/abstractions.js";
import {
    ListFilesRepository as RepositoryAbstraction,
    ListFilesGateway,
    type ListFilesGatewayParams,
    type ListFilesGatewayResult
} from "./abstractions.js";

class ListFilesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListFilesGateway.Interface,
        private cache: FilesListCache.Interface
    ) {}

    async execute(params: ListFilesGatewayParams): Promise<ListFilesGatewayResult> {
        const result = await this.gateway.execute(params);

        runInAction(() => {
            this.cache.addItems(result.data);
        });

        return result;
    }
}

export const ListFilesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListFilesRepositoryImpl,
    dependencies: [ListFilesGateway, FilesListCache]
});
