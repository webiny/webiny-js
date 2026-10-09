import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CollabThreadMapper, type ICollabThreadValues } from "~/api/domain/thread/abstractions.js";
import {
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";
import { GetThreadRepository as Repository } from "./abstractions.js";

class GetThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: CollabThreadMapper.Interface
    ) {}

    async execute(id: string): Repository.Return {
        const modelResult = await this.getModel.execute(COLLAB_THREAD_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(modelResult.error));
        }

        const revisionId = createIdentifier({ id, version: 1 });

        const entryResult = await this.getEntryById.execute<ICollabThreadValues>(
            modelResult.value,
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
    dependencies: [GetEntryByIdUseCase, GetModelUseCase, CollabThreadMapper]
});
