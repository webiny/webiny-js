import { runInAction } from "mobx";
import { FilesListCache } from "../shared/abstractions.js";
import type { FmFile } from "../shared/types.js";
import {
    UpdateFileRepository as RepositoryAbstraction,
    UpdateFileGateway,
    type UpdateFileGatewayParams
} from "./abstractions.js";
import { FILE_FIELDS } from "~/features/shared/FILE_FIELDS.js";

class UpdateFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateFileGateway.Interface,
        private cache: FilesListCache.Interface
    ) {}

    async execute(params: UpdateFileGatewayParams): Promise<FmFile> {
        const file = await this.gateway.execute({
            ...params,
            fields: params.fields.length > 0 ? params.fields : FILE_FIELDS
        });

        runInAction(() => {
            this.cache.updateItems(item => (item.id === file.id ? file : item));
        });

        return file;
    }
}

export const UpdateFileRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFileRepositoryImpl,
    dependencies: [UpdateFileGateway, FilesListCache]
});
