import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import {
    CollabThreadMapper,
    CollabThreadModel,
    type ICollabThreadValues
} from "~/domain/thread/abstractions.js";
import { CollabThreadNotFoundError, CollabThreadPersistenceError } from "~/domain/thread/errors.js";
import { GetThreadRepository as Repository } from "./abstractions.js";

class GetThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private model: CollabThreadModel.Interface,
        private mapper: CollabThreadMapper.Interface
    ) {}

    async execute(id: string): Repository.Return {
        const revisionId = createIdentifier({ id, version: 1 });

        const entryResult = await this.getEntryById.execute<ICollabThreadValues>(
            this.model,
            revisionId
        );

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new CollabThreadNotFoundError({ id }));
            }
            return Result.fail(new CollabThreadPersistenceError(entryResult.error));
        }

        return Result.ok(this.mapper.fromCmsEntry(entryResult.value));
    }
}

export const GetThreadRepository = Repository.createImplementation({
    implementation: GetThreadRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, CollabThreadModel, CollabThreadMapper]
});
