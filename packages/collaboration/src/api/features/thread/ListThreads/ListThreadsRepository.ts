import { Result } from "@webiny/feature/api";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CollabThreadMapper, type ICollabThreadValues } from "~/api/domain/thread/abstractions.js";
import { CollabThreadPersistenceError } from "~/api/domain/thread/errors.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";
import { ListThreadsRepository as Repository } from "./abstractions.js";

class ListThreadsRepositoryImpl implements Repository.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: CollabThreadMapper.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface
    ) {}

    async execute(params: Repository.Params): Repository.Return {
        const modelResult = await this.getModel.execute(COLLAB_THREAD_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(modelResult.error));
        }

        const model = modelResult.value;

        const where = this.cmsWhereMapper.map({
            input: params.where,
            fields: model.fields
        });

        const sort = (params.sort ?? ["createdOn_DESC"]) as (`${string}_ASC` | `${string}_DESC`)[];

        const listResult = await this.listLatestEntries.execute<ICollabThreadValues>(model, {
            sort,
            limit: params.limit ?? 100,
            after: params.after ?? undefined,
            where
        });

        if (listResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        return Result.ok({
            items: entries.map(entry => this.mapper.fromCmsEntry(entry)),
            meta
        });
    }
}

export const ListThreadsRepository = Repository.createImplementation({
    implementation: ListThreadsRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, GetModelUseCase, CollabThreadMapper, CmsWhereMapper]
});
