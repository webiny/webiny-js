import { runInAction } from "mobx";
import { FilesListCache } from "../shared/abstractions.js";
import {
    DeleteFileRepository as RepositoryAbstraction,
    DeleteFileGateway,
    type DeleteFileGatewayParams
} from "./abstractions.js";

class DeleteFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteFileGateway.Interface,
        private cache: FilesListCache.Interface
    ) {}

    async execute(params: DeleteFileGatewayParams): Promise<boolean> {
        const result = await this.gateway.execute(params);

        runInAction(() => {
            this.cache.removeItems(item => item.id === params.id);
        });

        return result;
    }
}

export const DeleteFileRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteFileRepositoryImpl,
    dependencies: [DeleteFileGateway, FilesListCache]
});
